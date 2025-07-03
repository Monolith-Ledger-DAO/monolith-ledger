"use client";

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { contracts } from "@/config/contracts";
import { monolithGovernanceTokenABI } from "@/abi/MonolithGovernanceToken.abi";
import { Address, formatUnits } from "viem";

// Базовый хук для чтения информации о токене
export function useLITHInfo() {
  const contractConfig = {
    address: contracts.governanceToken as Address,
    abi: monolithGovernanceTokenABI,
  };

  const { data: name, isLoading: isNameLoading } = useReadContract({
    ...contractConfig,
    functionName: "name",
  });

  const { data: symbol, isLoading: isSymbolLoading } = useReadContract({
    ...contractConfig,
    functionName: "symbol",
  });

  const { data: totalSupply, isLoading: isTotalSupplyLoading } = useReadContract({
    ...contractConfig,
    functionName: "totalSupply",
  });

  return { name, symbol, totalSupply, isLoading: isNameLoading || isSymbolLoading || isTotalSupplyLoading };
}

// Новый хук для получения данных о пользователе
export function useUserLITHAccount() {
    const { address } = useAccount();

    const { data: balance, refetch: refetchBalance } = useReadContract({
        address: contracts.governanceToken as Address,
        abi: monolithGovernanceTokenABI,
        functionName: 'balanceOf',
        args: [address!],
        query: { enabled: !!address },
    });

    const { data: delegate, refetch: refetchDelegate } = useReadContract({
        address: contracts.governanceToken as Address,
        abi: monolithGovernanceTokenABI,
        functionName: 'delegates',
        args: [address!],
        query: { enabled: !!address },
    });
    
    const { data: hash, writeContract, isPending: isDelegating } = useWriteContract();

    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

    const formattedBalance = balance ? Number(formatUnits(balance, 18)).toFixed(4) : "0";

    return {
        balance,
        formattedBalance,
        delegate,
        isDelegating,
        isConfirming,
        isConfirmed,
        writeContract,
        refetch: () => {
            refetchBalance();
            refetchDelegate();
        }
    }
}
