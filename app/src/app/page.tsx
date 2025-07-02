"use client";

import { ConnectButton } from "@/components/ConnectButton";
import { useLITHInfo } from "@/hooks/useLITHInfo";
import { formatUnits } from "viem";
import { UserProfile } from "@/components/UserProfile";

export default function Home() {
  const { name, symbol, totalSupply, isLoading } = useLITHInfo();

  let formattedTotalSupply = "0";
  if (typeof totalSupply === "bigint") {
    formattedTotalSupply = Number(formatUnits(totalSupply, 18)).toLocaleString();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-900 text-white">
      <div className="fixed top-4 right-4">
        <ConnectButton />
      </div>

      <div className="text-center">
        <h1 className="text-5xl font-bold mb-4">Monolith Ledger DAO</h1>
        
        <div className="mt-8 p-6 border border-gray-700 rounded-lg bg-gray-800/50 min-w-[350px]">
          {isLoading ? (
            <p>Loading contract data...</p>
          ) : (
            <div className="text-lg space-y-2 font-mono">
              <p>Token Name: <strong>{String(name)}</strong></p>
              <p>Symbol: <strong>{String(symbol)}</strong></p>
              <p>Total Supply: <strong>{formattedTotalSupply}</strong></p>
            </div>
          )}
        </div>
        <UserProfile />
      </div>
    </main>
  );
}
