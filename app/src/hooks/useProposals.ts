import { useCallback } from "react";
import { useWriteContract } from "wagmi";
import { MONOLITH_LEDGER_DAO_ABI } from "../abi/MonolithLedgerDAO.abi";
import { readContract } from "@wagmi/core";
import { config } from "../providers/WagmiProvider";
import { viemClient } from "../lib/viemClient";
import { decodeEventLog } from "viem";
import type { AbiEvent } from "viem";
import { contracts } from "../config/contracts";
import { Address } from "viem";

const DAO_ADDRESS = contracts.dao as Address;
const IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

// ABI-фрагмент события ProposalCreated
const proposalCreatedEventAbi = [
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint256", name: "proposalId", type: "uint256" },
      { indexed: false, internalType: "address", name: "proposer", type: "address" },
      { indexed: false, internalType: "address[]", name: "targets", type: "address[]" },
      { indexed: false, internalType: "uint256[]", name: "values", type: "uint256[]" },
      { indexed: false, internalType: "string[]", name: "signatures", type: "string[]" },
      { indexed: false, internalType: "bytes[]", name: "calldatas", type: "bytes[]" },
      { indexed: false, internalType: "uint256", name: "voteStart", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "voteEnd", type: "uint256" },
      { indexed: false, internalType: "string", name: "description", type: "string" }
    ],
    name: "ProposalCreated",
    type: "event"
  }
] as unknown as AbiEvent[];

export function useProposals() {
  // const { address } = useAccount();
  const { writeContractAsync, isPending: isWritePending, error: writeError } = useWriteContract();

  // 1. Получить статус предложения
  const getProposalState = useCallback(async (proposalId: string | number | bigint): Promise<unknown> => {
    if (!DAO_ADDRESS) throw new Error("DAO address is not set");
    let proposalIdBigInt: bigint;
    try {
      if (typeof proposalId === "bigint") {
        proposalIdBigInt = proposalId;
      } else if (typeof proposalId === "number") {
        proposalIdBigInt = BigInt(proposalId);
      } else if (typeof proposalId === "string") {
        const trimmed = proposalId.trim();
        if (/^\d+$/.test(trimmed)) {
          proposalIdBigInt = BigInt(trimmed);
        } else if (/^0x[0-9a-fA-F]{64}$/.test(trimmed)) {
          proposalIdBigInt = BigInt(trimmed);
        } else {
          throw new Error("proposalId должен быть числом, строкой-числом или hex-строкой (bytes32), а не: " + proposalId);
        }
      } else {
        throw new Error("proposalId должен быть числом, строкой-числом или hex-строкой (bytes32), а не: " + proposalId);
      }
    } catch {
      throw new Error("Некорректный proposalId: " + proposalId + ". Должен быть числом или строкой-числом.");
    }
    const proposalsFnRaw = MONOLITH_LEDGER_DAO_ABI.find((item) => {
      const obj = item as unknown as { name?: unknown; inputs?: unknown };
      return (
        typeof obj.name === "string" &&
        obj.name === "proposals" &&
        Array.isArray(obj.inputs) &&
        obj.inputs.length === 1 &&
        typeof obj.inputs[0] === "object" &&
        obj.inputs[0] !== null &&
        "type" in obj.inputs[0] &&
        (obj.inputs[0] as { type?: unknown }).type === "uint256"
      );
    });
    const proposalsFn = proposalsFnRaw as
      | ({ name: string; inputs: readonly { type: string }[] } & typeof proposalsFnRaw)
      | undefined;
    if (!proposalsFn) throw new Error("ABI: proposals(uint256) not found");
    return await readContract(config, {
      address: DAO_ADDRESS,
      abi: [proposalsFn],
      functionName: "proposals",
      args: [proposalIdBigInt],
    });
  }, []);

  // 2. Получить детали предложения (title, description) через событие ProposalCreated
  const getProposalDetails = useCallback(async (proposalId: string | number | bigint) => {
    if (!DAO_ADDRESS) throw new Error("DAO address is not set");
    const logs = await viemClient.getLogs({
      address: DAO_ADDRESS,
      event: proposalCreatedEventAbi[0] as AbiEvent,
      fromBlock: 0n,
      toBlock: "latest",
      strict: true,
    });
    let foundArgs: Record<string, unknown> | null = null;
    let foundProposalId: bigint | null = null;
    for (const log of logs) {
      try {
        const decoded = decodeEventLog({
          abi: proposalCreatedEventAbi as AbiEvent[],
          data: log.data,
          topics: log.topics,
        });
        const argsObj = decoded.args as Record<string, unknown>;
        const eventProposalId = argsObj.proposalId as bigint;
        if (eventProposalId && BigInt(eventProposalId).toString() === BigInt(proposalId).toString()) {
          foundArgs = argsObj;
          foundProposalId = eventProposalId;
          break;
        }
      } catch (e) {
        // skip non-matching logs
      }
    }
    if (!foundArgs || !foundProposalId) throw new Error("Proposal not found");
    const descriptionHash = foundArgs.description as string;
    let res;
    try {
      res = await fetch(IPFS_GATEWAY + descriptionHash);
    } catch (e) {
      throw new Error("Ошибка загрузки описания предложения с IPFS: " + (e instanceof Error ? e.message : String(e)));
    }
    if (!res.ok) throw new Error("Ошибка загрузки описания предложения с IPFS (status: " + res.status + ")");
    const data = await res.json();
    return { title: data.title as string, description: data.description as string, proposalId: foundProposalId };
  }, []);

  // 3. Голосование
  const castVote = useCallback(async (proposalId: string | number | bigint, support: number) => {
    if (!DAO_ADDRESS) throw new Error("DAO address is not set");
    let proposalIdBigInt: bigint;
    if (typeof proposalId === "bigint") {
      proposalIdBigInt = proposalId;
    } else if (typeof proposalId === "number") {
      proposalIdBigInt = BigInt(proposalId);
    } else if (typeof proposalId === "string") {
      const trimmed = proposalId.trim();
      if (/^\d+$/.test(trimmed)) {
        proposalIdBigInt = BigInt(trimmed);
      } else if (/^0x[0-9a-fA-F]{64}$/.test(trimmed)) {
        proposalIdBigInt = BigInt(trimmed);
      } else {
        throw new Error("proposalId должен быть числом, строкой-числом или hex-строкой (bytes32), а не: " + proposalId);
      }
    } else {
      throw new Error("proposalId должен быть числом, строкой-числом или hex-строкой (bytes32), а не: " + proposalId);
    }
    return await writeContractAsync({
      address: DAO_ADDRESS,
      abi: MONOLITH_LEDGER_DAO_ABI,
      functionName: "castVote",
      args: [proposalIdBigInt, support],
    });
  }, [writeContractAsync]);

  // 4. Проверить, голосовал ли пользователь
  const getVotes = useCallback(async (proposalId: string | number | bigint, account?: string): Promise<boolean> => {
    if (!DAO_ADDRESS) throw new Error("DAO address is not set");
    if (!account) return false;
    let proposalIdBigInt: bigint;
    if (typeof proposalId === "bigint") {
      proposalIdBigInt = proposalId;
    } else if (typeof proposalId === "number") {
      proposalIdBigInt = BigInt(proposalId);
    } else if (typeof proposalId === "string") {
      const trimmed = proposalId.trim();
      if (/^\d+$/.test(trimmed)) {
        proposalIdBigInt = BigInt(trimmed);
      } else if (/^0x[0-9a-fA-F]{64}$/.test(trimmed)) {
        proposalIdBigInt = BigInt(trimmed);
      } else {
        throw new Error("proposalId должен быть числом, строкой-числом или hex-строкой (bytes32), а не: " + proposalId);
      }
    } else {
      throw new Error("proposalId должен быть числом, строкой-числом или hex-строкой (bytes32), а не: " + proposalId);
    }
    try {
      const result = await readContract(config, {
        address: DAO_ADDRESS,
        abi: MONOLITH_LEDGER_DAO_ABI,
        functionName: "hasVoted",
        args: [proposalIdBigInt], // исправлено: только один аргумент
      });
      return Boolean(result);
    } catch (e) {
      return false;
    }
  }, []);

  // Получить последний валидный proposal (существующий в контракте)
  const getLatestValidProposal = useCallback(async () => {
    if (!DAO_ADDRESS) throw new Error("DAO address is not set");
    const logs = await viemClient.getLogs({
      address: DAO_ADDRESS,
      event: proposalCreatedEventAbi[0] as AbiEvent,
      fromBlock: 0n,
      toBlock: "latest",
      strict: true,
    });
    for (let i = logs.length - 1; i >= 0; i--) {
      try {
        const decoded = decodeEventLog({
          abi: proposalCreatedEventAbi as AbiEvent[],
          data: logs[i].data,
          topics: logs[i].topics,
        });
        const argsObj = decoded.args as Record<string, unknown>;
        const proposalId = argsObj.proposalId as bigint;
        // Проверяем, существует ли proposalId в контракте
        await readContract(config, {
          address: DAO_ADDRESS,
          abi: MONOLITH_LEDGER_DAO_ABI,
          functionName: "proposals",
          args: [proposalId],
        });
        // Если не выбросило ошибку — возвращаем детали
        const descriptionHash = argsObj.description as string;
        let res;
        try {
          res = await fetch(IPFS_GATEWAY + descriptionHash);
        } catch (e) {
          throw new Error("Ошибка загрузки описания предложения с IPFS: " + (e instanceof Error ? e.message : String(e)));
        }
        if (!res.ok) throw new Error("Ошибка загрузки описания предложения с IPFS (status: " + res.status + ")");
        const data = await res.json();
        return { proposalId, title: data.title as string, description: data.description as string };
      } catch (e) {
        // Пропускаем невалидные proposalId
      }
    }
    throw new Error("Нет валидных предложений");
  }, []);

  // Получить список всех предложений (валидных и невалидных)
  const getAllProposals = useCallback(async () => {
    if (!DAO_ADDRESS) throw new Error("DAO address is not set");
    const logs = await viemClient.getLogs({
      address: DAO_ADDRESS,
      event: proposalCreatedEventAbi[0] as AbiEvent,
      fromBlock: 0n,
      toBlock: "latest",
      strict: true,
    });
    const proposals = [];
    for (const log of logs) {
      try {
        const decoded = decodeEventLog({
          abi: proposalCreatedEventAbi as AbiEvent[],
          data: log.data,
          topics: log.topics,
        });
        const argsObj = decoded.args as Record<string, unknown>;
        const proposalId = argsObj.proposalId as bigint;
        const descriptionHash = argsObj.description as string;
        let title = "", description = "";
        try {
          const res = await fetch(IPFS_GATEWAY + descriptionHash);
          if (res.ok) {
            const data = await res.json();
            title = data.title as string;
            description = data.description as string;
          }
        } catch {}
        proposals.push({ proposalId, title, description });
      } catch {}
    }
    return proposals;
  }, []);

  return {
    getProposalState,
    getProposalDetails,
    castVote,
    getVotes,
    getLatestValidProposal,
    getAllProposals,
    isWritePending,
    writeError,
  };
}
