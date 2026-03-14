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
  const [supported, setSupported] = useState(true);
  const [supportReason, setSupportReason] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await api.getTokenBalances();
      setTokens(data.balances);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    const init = async () => {
      try {
        const status = await api.getTokenSupport();
        if (cancelled) return;

        setSupported(status.supported);
        setSupportReason(status.reason ?? null);

        if (!status.supported) {
          setTokens([]);
          setError(null);
          setLoading(false);
          return;
        }

        await refresh();
        if (!cancelled) {
          interval = setInterval(refresh, pollInterval);
        }
      } catch (err: any) {
        if (cancelled) return;
        setSupported(false);
        setSupportReason(err.message ?? "Token support is unavailable.");
        setTokens([]);
        setError(null);
        setLoading(false);
      }
    };

    init();

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
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

  return {
    tokens,
    loading,
    error,
    supported,
    supportReason,
    refresh,
    issueToken,
    transferToken,
  };
}
