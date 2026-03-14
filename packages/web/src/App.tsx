import React, { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";
import { api } from "./api/client";
import { BalanceCard } from "./components/BalanceCard/BalanceCard";
import { ReceiveDialog } from "./components/ReceiveFlow/ReceiveDialog";
import { SendDialog } from "./components/SendFlow/SendDialog";
import { CreateWallet } from "./components/Setup/CreateWallet";
import { TokensPanel } from "./components/TokensPanel/TokensPanel";
import { TransactionList } from "./components/TransactionList/TransactionList";
import { useBalance } from "./hooks/useBalance";
import { useTransactions } from "./hooks/useTransactions";

type AppState = "loading" | "setup" | "dashboard";

export default function App() {
  const [appState, setAppState] = useState<AppState>("loading");
  const [sendOpen, setSendOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);

  const { balance, loading: balanceLoading, refresh: refreshBalance } = useBalance();
  const { transactions, loading: txLoading, refresh: refreshTx } = useTransactions();

  useEffect(() => {
    api
      .getStatus()
      .then((status) => setAppState(status.initialized ? "dashboard" : "setup"))
      .catch(() => setAppState("setup"));
  }, []);

  const handleWalletCreated = () => {
    setAppState("dashboard");
    refreshBalance();
    refreshTx();
  };

  const handleSent = () => {
    refreshBalance();
    refreshTx();
  };

  // Loading state
  if (appState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="relative mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mx-auto shadow-lg shadow-orange-500/20">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <div className="absolute inset-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 mx-auto animate-ping opacity-20" />
          </div>
          <p className="text-gray-500 text-sm font-medium">Opening your local Arkade wallet...</p>
        </div>
      </div>
    );
  }

  // Setup state
  if (appState === "setup") {
    return <CreateWallet onCreated={handleWalletCreated} />;
  }

  // Dashboard state
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-md shadow-orange-500/15">
              <Wallet className="w-[18px] h-[18px] text-white" />
            </div>
            <div>
              <h1 className="text-[15px] font-bold leading-tight">Arkade</h1>
              <p className="text-[11px] text-gray-500 font-medium">Bitcoin Wallet</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-full">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-[11px] text-emerald-400 font-semibold">Live</span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-lg mx-auto w-full px-5 py-6 space-y-5">
        {/* Balance card */}
        <div className="animate-fade-in">
          <BalanceCard
            balance={balance}
            loading={balanceLoading}
            onRefresh={refreshBalance}
          />
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3 animate-fade-in" style={{ animationDelay: "50ms" }}>
          <button
            onClick={() => setSendOpen(true)}
            className="btn-primary flex items-center justify-center gap-2.5 py-3.5"
          >
            <ArrowUpRight className="w-[18px] h-[18px]" />
            <span>Send</span>
          </button>
          <button
            onClick={() => setReceiveOpen(true)}
            className="btn-secondary flex items-center justify-center gap-2.5 py-3.5"
          >
            <ArrowDownLeft className="w-[18px] h-[18px]" />
            <span>Receive</span>
          </button>
        </div>

        {/* Transaction history */}
        <div className="animate-fade-in" style={{ animationDelay: "100ms" }}>
          <TransactionList transactions={transactions} loading={txLoading} />
        </div>

        {/* Tokens */}
        <div className="animate-fade-in" style={{ animationDelay: "150ms" }}>
          <TokensPanel />
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4">
        <p className="text-[11px] text-gray-600">
          Powered by <span className="text-gray-500 font-medium">Arkade Protocol</span> | self-custodial in this browser
        </p>
      </footer>

      {/* Dialogs */}
      <SendDialog
        open={sendOpen}
        onClose={() => setSendOpen(false)}
        onSent={handleSent}
        availableSats={balance?.availableSats ?? 0}
      />
      <ReceiveDialog
        open={receiveOpen}
        onClose={() => setReceiveOpen(false)}
      />
    </div>
  );
}
