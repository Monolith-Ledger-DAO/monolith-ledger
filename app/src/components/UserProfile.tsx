"use client";

import { useUserLITHAccount } from "@/hooks/useLITHInfo";
import { useAccount } from "wagmi";
import { useState, useEffect } from "react";
import { monolithGovernanceTokenABI } from "@/abi/MonolithGovernanceToken.abi";
import { Address } from "viem";
import { contracts } from "@/config/contracts";

export function UserProfile() {
  const { address, isConnected, chain } = useAccount();
  const {
    formattedBalance,
    delegate,
    isDelegating,
    isConfirming,
    isConfirmed,
    writeContract,
    refetch
  } = useUserLITHAccount();
  const [delegateTo, setDelegateTo] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Автоматически подставлять свой адрес для делегирования
  useEffect(() => {
    if (address) setDelegateTo(address);
  }, [address]);

  const isValidAddress = (addr: string | undefined): addr is Address => {
    return !!addr && addr.startsWith("0x") && addr.length === 42;
  };

  const handleDelegate = async () => {
    setError("");
    if (!isValidAddress(address) || !isValidAddress(delegateTo)) {
      setError("Некорректный адрес для делегирования.");
      return;
    }
    try {
      await writeContract({
        address: contracts.governanceToken as Address,
        abi: monolithGovernanceTokenABI,
        functionName: "delegate",
        args: [delegateTo as Address],
      });
      // После успешной отправки транзакции обновить данные
      refetch();
    } catch (e: any) {
      setError(e?.message || "Ошибка делегирования");
    }
  };

  if (!isConnected) {
    return <div>Подключите кошелек для отображения профиля.</div>;
  }

  if (!chain || chain.id !== 31337) {
    return <div className="text-red-600">Подключитесь к сети Hardhat (Chain ID 31337) в MetaMask!</div>;
  }

  return (
    <div className="border rounded-lg p-4 max-w-md mx-auto bg-white shadow">
      <h2 className="text-xl font-bold mb-2">Личный кабинет</h2>
      <div className="mb-2">Ваш адрес: <span className="font-mono">{address}</span></div>
      <div className="mb-2">Баланс LITH: <span className="font-semibold">{formattedBalance}</span></div>
      <div className="mb-2">Делегат: <span className="font-mono">{delegate as string}</span></div>
      {/* Кнопка делегирования скрывается после успешного делегирования */}
      {!isConfirmed && (
        <div className="flex gap-2 items-center mt-4">
          <input
            placeholder="Адрес для делегирования"
            value={delegateTo}
            onChange={e => setDelegateTo(e.target.value)}
            className="flex-1 border px-2 py-1 rounded"
          />
          <button
            onClick={handleDelegate}
            disabled={isDelegating || !isValidAddress(delegateTo) || !isValidAddress(address)}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {isDelegating ? "Делегирование..." : "Делегировать"}
          </button>
        </div>
      )}
      {error && <div className="text-red-600 mt-2">{error}</div>}
      {isConfirming && <div className="text-yellow-600 mt-2">Ожидание подтверждения...</div>}
      {isConfirmed && <div className="text-green-600 mt-2">Делегирование успешно!</div>}
    </div>
  );
}

export default UserProfile;
