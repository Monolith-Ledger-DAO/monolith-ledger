"use client";

import { useReadContract } from "wagmi";
import { contracts } from "@/config/contracts";
import MonolithGovernanceToken from "@/abi/MonolithGovernanceToken.json";

export function useLITHInfo() {
  const {
    data: tokenInfo,
    error,
    isLoading,
  } = useReadContract({
    address: contracts.governanceToken as `0x${string}`,
    abi: MonolithGovernanceToken.abi,
    functionName: "name",
  });

  const { data: symbol } = useReadContract({
    address: contracts.governanceToken as `0x${string}`,
    abi: MonolithGovernanceToken.abi,
    functionName: "symbol",
  });

  const { data: totalSupply } = useReadContract({
    address: contracts.governanceToken as `0x${string}`,
    abi: MonolithGovernanceToken.abi,
    functionName: "totalSupply",
  });

  return {
    name: tokenInfo,
    symbol,
    totalSupply,
    isLoading,
    error,
  };
}
