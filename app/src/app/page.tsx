"use client";

import { ConnectButton } from "@/components/ConnectButton";
import { useLITHInfo } from "@/hooks/useLITHInfo";
import { formatUnits } from "viem";

export default function Home() {
  const { name, symbol, totalSupply, isLoading } = useLITHInfo();

  const formattedTotalSupply = totalSupply
    ? formatUnits(totalSupply as bigint, 18)
    : "0";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50 dark:bg-black">
      <div className="fixed top-4 right-4">
        <ConnectButton />
      </div>
      <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-8">
        Monolith Ledger
      </h1>
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Token Information
        </h2>
        {isLoading ? (
          <p className="text-gray-600 dark:text-gray-300">Loading token data...</p>
        ) : (
          <div className="space-y-2">
            <p className="text-gray-700 dark:text-gray-200">
              <span className="font-semibold">Name:</span> {name?.toString()}
            </p>
            <p className="text-gray-700 dark:text-gray-200">
              <span className="font-semibold">Symbol:</span> {symbol?.toString()}
            </p>
            <p className="text-gray-700 dark:text-gray-200">
              <span className="font-semibold">Total Supply:</span> {formattedTotalSupply}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
