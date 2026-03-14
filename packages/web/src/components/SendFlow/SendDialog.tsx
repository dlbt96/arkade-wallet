import React, { useState, useEffect } from "react";
import { ArrowUpRight, X, Zap, Globe, Layers, Loader2, Check, AlertCircle } from "lucide-react";
import { useSend } from "../../hooks/useSend";
import { formatSats, routeLabel } from "../../lib/format";

interface Props {
  open: boolean;
  onClose: () => void;
  onSent: () => void;
  availableSats: number;
}

type Step = "input" | "confirm" | "sending" | "success";

const ROUTE_ICONS = { ark: Layers, lightning: Zap, onchain: Globe } as const;
const ROUTE_COLORS = {
  ark: "text-orange-400",
  lightning: "text-yellow-400",
  onchain: "text-blue-400",
} as const;

export function SendDialog({ open, onClose, onSent, availableSats }: Props) {
  const [step, setStep] = useState<Step>("input");
  const [destination, setDestination] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const { preview, previewDestination, send, result, sending, error, reset } = useSend();

  const amount = parseInt(amountStr, 10) || 0;

  useEffect(() => {
    if (destination.length > 10) {
      const timer = setTimeout(() => previewDestination(destination), 300);
      return () => clearTimeout(timer);
    }
  }, [destination, previewDestination]);

  useEffect(() => {
    if (preview?.invoiceAmountSats) {
      setAmountStr(preview.invoiceAmountSats.toString());
    }
  }, [preview]);

  const handleConfirm = async () => {
    setStep("sending");
    try {
      await send(destination, amount);
      setStep("success");
      onSent();
    } catch {
      setStep("confirm");
    }
  };

  const handleClose = () => {
    setStep("input");
    setDestination("");
    setAmountStr("");
    reset();
    onClose();
  };

  if (!open) return null;

  const RouteIcon = preview ? ROUTE_ICONS[preview.type] : Layers;
  const routeColor = preview ? ROUTE_COLORS[preview.type] : "text-gray-400";

  return (
    <div className="glass-overlay flex items-end sm:items-center justify-center p-4" onClick={handleClose}>
      <div className="dialog-panel p-7 animate-slide-up" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button onClick={handleClose} className="absolute top-5 right-5 btn-ghost p-2 z-10">
          <X className="w-5 h-5" />
        </button>

        {/* ── Success ──────────────────────────────────── */}
        {step === "success" && (
          <div className="text-center py-6 animate-scale-in">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center mx-auto mb-5">
              <Check className="w-9 h-9 text-emerald-400" />
            </div>
            <h3 className="text-2xl font-bold">Payment Sent</h3>
            <p className="text-gray-400 text-lg mt-2 font-mono">{formatSats(result?.amount ?? 0)}</p>
            {result?.fee != null && result.fee > 0 && (
              <p className="text-gray-600 text-xs mt-1">Fee: {formatSats(result.fee)}</p>
            )}
            <div className="bg-white/[0.03] rounded-xl p-3 mt-5 mx-4">
              <p className="text-[11px] text-gray-500 mb-1">Transaction ID</p>
              <p className="text-[12px] text-gray-400 font-mono break-all leading-relaxed">
                {result?.txid}
              </p>
            </div>
            <button onClick={handleClose} className="btn-primary mt-6 px-10">
              Done
            </button>
          </div>
        )}

        {/* ── Sending ──────────────────────────────────── */}
        {step === "sending" && (
          <div className="text-center py-16 animate-fade-in">
            <div className="relative mx-auto w-16 h-16 mb-5">
              <div className="absolute inset-0 rounded-full bg-orange-500/10 animate-ping" />
              <div className="relative w-16 h-16 rounded-full bg-orange-500/15 border border-orange-500/20 flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-orange-400 animate-spin" />
              </div>
            </div>
            <p className="text-gray-300 font-medium">Sending Bitcoin...</p>
            <p className="text-gray-500 text-sm mt-1">
              via {routeLabel(preview?.type ?? "ark")}
            </p>
          </div>
        )}

        {/* ── Confirm ──────────────────────────────────── */}
        {step === "confirm" && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-xl font-bold pr-10">Confirm Payment</h3>

            {/* Summary card */}
            <div className="bg-white/[0.03] rounded-2xl border border-white/[0.05] divide-y divide-white/[0.04]">
              <div className="flex items-center justify-between px-5 py-4">
                <span className="text-sm text-gray-400">Amount</span>
                <span className="text-lg font-bold font-mono">{formatSats(amount)}</span>
              </div>
              <div className="flex items-center justify-between px-5 py-4">
                <span className="text-sm text-gray-400">Route</span>
                <span className={`flex items-center gap-2 text-sm font-semibold ${routeColor}`}>
                  <RouteIcon className="w-4 h-4" />
                  {routeLabel(preview?.type ?? "ark")}
                </span>
              </div>
              <div className="flex items-center justify-between px-5 py-4">
                <span className="text-sm text-gray-400">To</span>
                <span className="font-mono text-[12px] text-gray-300 max-w-[220px] truncate">
                  {destination}
                </span>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 bg-red-500/8 border border-red-500/12 rounded-xl p-3.5">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button onClick={() => setStep("input")} className="btn-secondary flex-1">
                Back
              </button>
              <button onClick={handleConfirm} className="btn-primary flex-1">
                Confirm Send
              </button>
            </div>
          </div>
        )}

        {/* ── Input ────────────────────────────────────── */}
        {step === "input" && (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3 pr-10">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/15 flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Send Bitcoin</h3>
                <p className="text-[12px] text-gray-500">To any address, invoice, or URI</p>
              </div>
            </div>

            {/* Destination */}
            <div>
              <label className="block text-[12px] text-gray-400 font-medium mb-2 ml-1">Recipient</label>
              <textarea
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Paste address, invoice, or bitcoin: URI"
                className="input-field font-mono text-[13px] h-20 resize-none"
                autoFocus
              />
              {preview && (
                <div className={`flex items-center gap-1.5 mt-2 ml-1 ${routeColor}`}>
                  <RouteIcon className="w-3 h-3" />
                  <span className="text-[12px] font-medium">
                    Sending via {routeLabel(preview.type)}
                  </span>
                </div>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-[12px] text-gray-400 font-medium mb-2 ml-1">Amount</label>
              <div className="relative">
                <input
                  type="number"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  placeholder="0"
                  className="input-field font-mono text-lg pr-16"
                  disabled={!!preview?.invoiceAmountSats}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">
                  sats
                </span>
              </div>
              <div className="flex items-center justify-between mt-2 ml-1">
                <p className="text-[12px] text-gray-600">
                  Available: <span className="text-gray-500 font-mono">{formatSats(availableSats)}</span>
                </p>
                {availableSats > 0 && !preview?.invoiceAmountSats && (
                  <button
                    onClick={() => setAmountStr(availableSats.toString())}
                    className="text-[11px] text-orange-400 hover:text-orange-300 font-semibold transition-colors"
                  >
                    MAX
                  </button>
                )}
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 bg-red-500/8 border border-red-500/12 rounded-xl p-3.5">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={() => setStep("confirm")}
              disabled={!destination || !amount || amount > availableSats}
              className="btn-primary w-full"
            >
              Review Payment
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
