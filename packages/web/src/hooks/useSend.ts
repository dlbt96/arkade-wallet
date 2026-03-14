import { useState, useCallback } from "react";
import { api } from "../api/client";

export interface SendState {
  sending: boolean;
  result: {
    txid: string;
    route: "ark" | "lightning" | "onchain";
    amount: number;
    fee?: number;
  } | null;
  error: string | null;
  preview: {
    type: "ark" | "lightning" | "onchain";
    invoiceAmountSats?: number;
  } | null;
}

export function useSend() {
  const [state, setState] = useState<SendState>({
    sending: false,
    result: null,
    error: null,
    preview: null,
  });

  const previewDestination = useCallback(async (destination: string) => {
    try {
      const preview = await api.previewSend(destination);
      setState((s) => ({ ...s, preview, error: null }));
    } catch (err: any) {
      setState((s) => ({ ...s, preview: null, error: err.message }));
    }
  }, []);

  const send = useCallback(async (destination: string, amountSats: number) => {
    setState((s) => ({ ...s, sending: true, error: null, result: null }));
    try {
      const result = await api.send(destination, amountSats);
      setState({ sending: false, result, error: null, preview: null });
      return result;
    } catch (err: any) {
      setState((s) => ({ ...s, sending: false, error: err.message }));
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ sending: false, result: null, error: null, preview: null });
  }, []);

  return { ...state, send, previewDestination, reset };
}
