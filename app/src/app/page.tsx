import { ConnectButton } from "@/components/ConnectButton";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50 dark:bg-black">
      <div className="fixed top-4 right-4">
         <ConnectButton />
      </div>
      <h1 className="text-5xl font-bold text-gray-900 dark:text-white">
        Monolith Ledger
      </h1>
    </main>
  );
}
