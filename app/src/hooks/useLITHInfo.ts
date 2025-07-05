"use client";

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { contracts } from "@/config/contracts";
import { monolithGovernanceTokenABI } from "@/abi/MonolithGovernanceToken.abi";
import { Address, formatUnits } from "viem";
import { useState, useEffect } from "react";

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
    const [error, setError] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);

    const { data: balance, refetch: refetchBalance, isLoading: isBalanceLoading, error: balanceError } = useReadContract({
        address: contracts.governanceToken as Address,
        abi: monolithGovernanceTokenABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        query: { enabled: !!address },
    });

    const { data: delegate, refetch: refetchDelegate, isLoading: isDelegateLoading, error: delegateError } = useReadContract({
        address: contracts.governanceToken as Address,
        abi: monolithGovernanceTokenABI,
        functionName: 'delegates',
        args: address ? [address] : undefined,
        query: { enabled: !!address },
    });
    
    const { data: hash, writeContract, isPending: isDelegating, error: writeError } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

    const formattedBalance = balance ? Number(formatUnits(balance, 18)).toFixed(4) : "0";

    useEffect(() => {
        if (balanceError || delegateError || writeError) {
            setError(balanceError?.message || delegateError?.message || writeError?.message || "");
        }
    }, [balanceError, delegateError, writeError]);

    return {
        balance,
        formattedBalance,
        delegate,
        isDelegating,
        isConfirming,
        isConfirmed,
        writeContract,
        isLoading: isBalanceLoading || isDelegateLoading || isDelegating || isConfirming,
        error,
        refetch: () => {
            refetchBalance();
            refetchDelegate();
        }
    }
}
