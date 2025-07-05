"use client";
import React, { useEffect, useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { useProposals } from "../hooks/useProposals";
import { contracts } from "../config/contracts";
import { encodeFunctionData } from "viem";
import { MONOLITH_LEDGER_DAO_ABI } from "../abi/MonolithLedgerDAO.abi";

export const ProposalCard: React.FC = () => {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { getAllProposals } = useProposals();

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string>("");
  const [allProposals, setAllProposals] = useState<any[]>([]);

  // Получение всех предложений
  useEffect(() => {
    getAllProposals().then(setAllProposals).catch((e) => setError(String(e)));
  }, [creating]);

  // Создание тестового предложения
  const createTestProposal = async () => {
    setCreating(true);
    setError("");
    try {
      const daoAddress = contracts.dao;
      const assetToken = contracts.assetToken;
      if (!daoAddress) throw new Error("В конфиге не найден адрес dao.");
      if (!assetToken) throw new Error("В конфиге не найден адрес assetToken.");
      const assetTokenStr = typeof assetToken === 'string' ? assetToken : String(assetToken);
      if (!assetTokenStr || !assetTokenStr.startsWith('0x')) throw new Error('Некорректный адрес assetToken');
      const assetTokenAddress = assetTokenStr as `0x${string}`;
      const amountToMint = BigInt("1000000000000000000");
      const calldataRaw = encodeFunctionData({
        abi: [
          {
            name: "mint",
            type: "function",
            stateMutability: "nonpayable",
            inputs: [
              { name: "to", type: "address" },
              { name: "amount", type: "uint256" }
            ],
            outputs: []
          }
        ],
        functionName: "mint",
        args: [address, amountToMint]
      });
      if (!calldataRaw || typeof calldataRaw !== "string" || !calldataRaw.startsWith("0x")) throw new Error("Ошибка кодирования calldata");
      const calldata = calldataRaw;
      if (!calldata) throw new Error("Ошибка кодирования calldata: значение undefined");
      const description = `Test proposal at ${new Date().toISOString()}`;
      await writeContractAsync({
        address: daoAddress as `0x${string}`,
        abi: MONOLITH_LEDGER_DAO_ABI,
        functionName: "propose",
        args: [[assetTokenAddress], [0n], [calldata as `0x${string}`], description],
      });
      setTimeout(() => window.location.reload(), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-6 border rounded shadow bg-white max-w-xl mx-auto my-8">
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded mb-4"
        onClick={createTestProposal}
        disabled={creating}
      >
        {creating ? "Создание..." : "Создать тестовое предложение"}
      </button>
      {error && <div className="mt-2 text-red-500">{error}</div>}
      {allProposals.length === 0 && <div className="text-gray-500">Нет предложений</div>}
      {allProposals.length > 0 && (
        <div className="space-y-4">
          {allProposals.map((p) => (
            <div key={p.proposalId.toString()} className="border rounded p-4 bg-gray-50">
              <div className="font-bold break-all max-w-full text-sm">
                ID: {formatProposalId(p.proposalId)}
              </div>
              <div className="text-lg">{p.title || "Без названия"}</div>
              <div className="text-gray-700 mb-2">{p.description || "Нет описания"}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Функция для форматирования длинного proposalId
function formatProposalId(id: any) {
  const str = id?.toString();
  if (!str) return "-";
  if (str.length <= 16) return str;
  return str.slice(0, 6) + "..." + str.slice(-4);
}

export default ProposalCard;
