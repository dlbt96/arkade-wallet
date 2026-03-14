import { useState, useEffect, useCallback } from "react";
import { api } from "../api/client";

export interface TokenBalance {
  assetId: string;
  name: string;
  ticker: string;
  balance: number;
  decimals: number;
}

export function useTokens(pollInterval = 15_000) {
  const [tokens, setTokens] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await api.getTokenBalances();
      setTokens(data.balances);
      setError(null);
    } catch (err: any) {
      // Token support may not be available
      if (!err.message?.includes("not available")) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, pollInterval);
    return () => clearInterval(interval);
  }, [refresh, pollInterval]);

  const issueToken = useCallback(
    async (params: { name: string; ticker: string; amount: number; decimals?: number }) => {
      const result = await api.issueToken(params);
      await refresh();
      return result;
    },
    [refresh]
  );

  const transferToken = useCallback(
    async (params: { address: string; assetId: string; amount: number }) => {
      const result = await api.transferToken(params);
      await refresh();
      return result;
    },
    [refresh]
  );

  return { tokens, loading, error, refresh, issueToken, transferToken };
}
