import { useState, useEffect, useCallback } from "react";
import { api } from "../api/client";

export interface Transaction {
  id: string;
  type: "send" | "receive";
  route: "ark" | "lightning" | "onchain";
  amount: number;
  timestamp: string;
  status: string;
}

export function useTransactions(pollInterval = 15_000) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await api.getTransactions();
      setTransactions(data.transactions);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, pollInterval);
    return () => clearInterval(interval);
  }, [refresh, pollInterval]);

  return { transactions, loading, error, refresh };
}
