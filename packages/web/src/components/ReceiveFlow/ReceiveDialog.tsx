import React, { useState, useEffect } from "react";
import { ArrowDownLeft, X, Copy, Check, Zap, Layers, Globe, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { api, type LightningInvoiceLimits } from "../../api/client";

interface Props {
  open: boolean;
  onClose: () => void;
}

type Tab = "instant" | "lightning" | "onchain";

const TABS: { id: Tab; label: string; Icon: React.ElementType; desc: string; hint?: string }[] = [
  { id: "instant", label: "Instant", Icon: Layers, desc: "Share your Arkade address to receive Bitcoin instantly with zero confirmations." },
  { id: "lightning", label: "Lightning", Icon: Zap, desc: "Generate a one-time Lightning invoice. The sender pays via any Lightning wallet." },
  { id: "onchain", label: "Onchain", Icon: Globe, desc: "Receive a standard Bitcoin transaction. After confirmation, the wallet can convert funds into Arkade.", hint: "~10 min confirmation" },
];

export function ReceiveDialog({ open, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("instant");
  const [addresses, setAddresses] = useState<{ ark: string; boarding: string } | null>(null);
  const [invoice, setInvoice] = useState<string | null>(null);
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [invoiceLimits, setInvoiceLimits] = useState<LightningInvoiceLimits | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [loadingLimits, setLoadingLimits] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      api.getAddresses().then(setAddresses).catch(() => {});
    }
  }, [open]);

  useEffect(() => {
    if (!open || tab !== "lightning") return;

    let cancelled = false;

    setLoadingLimits(true);

    api
      .getLightningInvoiceLimits()
      .then((limits) => {
        if (!cancelled) {
          setInvoiceLimits(limits);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setInvoiceLimits(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingLimits(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, tab]);

  const invoiceAmountValue = parseInt(invoiceAmount, 10);
  const invoiceAmountError =
    !invoiceAmount.trim() ? null
    : Number.isNaN(invoiceAmountValue) || invoiceAmountValue <= 0 ? "Enter an amount greater than 0 sats."
    : invoiceLimits && invoiceAmountValue < invoiceLimits.min ? `Minimum Lightning invoice is ${invoiceLimits.min.toLocaleString()} sats.`
    : invoiceLimits && invoiceAmountValue > invoiceLimits.max ? `Maximum Lightning invoice is ${invoiceLimits.max.toLocaleString()} sats.`
    : null;

  const formatInvoiceError = (err: unknown): string => {
    if (err instanceof Error) {
      const match = err.message.match(/"error":"([^"]+)"/);
      if (match?.[1]) return match[1];
      if (err.message.trim()) return err.message;
    }

    return "Unable to generate Lightning invoice right now.";
  };

  const generateInvoice = async () => {
    if (invoiceAmountError) {
      setInvoiceError(invoiceAmountError);
      return;
    }

    const amount = parseInt(invoiceAmount, 10);
    if (!amount) return;

    setLoadingInvoice(true);
    setInvoiceError(null);

    try {
      const result = await api.createInvoice(amount);
      setInvoice(result.invoice);
    } catch (err) {
      console.error("Invoice error:", err);
      setInvoiceError(formatInvoiceError(err));
    } finally {
      setLoadingInvoice(false);
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setTab("instant");
    setInvoice(null);
    setInvoiceAmount("");
    setInvoiceError(null);
    onClose();
  };

  if (!open) return null;

  const displayValue =
    tab === "instant" ? addresses?.ark
    : tab === "onchain" ? addresses?.boarding
    : invoice;

  const activeTab = TABS.find((t) => t.id === tab)!;

  return (
    <div className="glass-overlay flex items-end sm:items-center justify-center p-4" onClick={handleClose}>
      <div className="dialog-panel p-7 animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <button onClick={handleClose} className="absolute top-5 right-5 btn-ghost p-2 z-10">
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6 pr-10">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/15 flex items-center justify-center">
            <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Receive Bitcoin</h3>
            <p className="text-[12px] text-gray-500">Choose how you'd like to receive</p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-white/[0.04] rounded-2xl p-1 mb-5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setInvoice(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-[13px] font-semibold transition-all duration-200 ${
                tab === t.id
                  ? "bg-white/[0.08] text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <t.Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab description */}
        <p className="text-[13px] text-gray-400 leading-relaxed mb-5">
          {activeTab.desc}
        </p>

        {/* Lightning: amount input */}
        {tab === "lightning" && !invoice && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <label className="block text-[12px] text-gray-400 font-medium mb-2 ml-1">Invoice Amount</label>
              <div className="relative">
                <input
                  type="number"
                  value={invoiceAmount}
                  onChange={(e) => {
                    setInvoiceAmount(e.target.value);
                    setInvoiceError(null);
                  }}
                  placeholder="0"
                  className="input-field font-mono text-lg pr-16"
                  autoFocus
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">
                  sats
                </span>
              </div>
            </div>
            {invoiceLimits && (
              <p className="text-[12px] text-gray-500 ml-1">
                Lightning invoices on this network support {invoiceLimits.min.toLocaleString()} to {invoiceLimits.max.toLocaleString()} sats.
              </p>
            )}
            {(invoiceAmountError || invoiceError) && (
              <div className="bg-red-500/8 border border-red-500/15 rounded-xl p-3">
                <p className="text-red-400 text-sm">{invoiceAmountError ?? invoiceError}</p>
              </div>
            )}
            <button
              onClick={generateInvoice}
              disabled={!invoiceAmount || loadingInvoice || loadingLimits || Boolean(invoiceAmountError)}
              className="btn-primary w-full"
            >
              {loadingInvoice ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                </span>
              ) : loadingLimits ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading limits...
                </span>
              ) : (
                "Generate Invoice"
              )}
            </button>
          </div>
        )}

        {/* QR + address/invoice display */}
        {displayValue && (
          <div className="space-y-4 animate-scale-in">
            <div className="flex justify-center">
              <div className="bg-white p-5 rounded-3xl shadow-lg">
                <QRCodeSVG
                  value={displayValue}
                  size={200}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#09090b"
                />
              </div>
            </div>

            <button
              onClick={() => copyText(displayValue)}
              className="w-full bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] rounded-2xl p-4 transition-all group cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-mono text-[11px] text-gray-400 break-all text-left leading-relaxed flex-1">
                  {displayValue}
                </p>
                <div className="flex-shrink-0 mt-0.5">
                  {copied ? (
                    <div className="flex items-center gap-1 text-emerald-400">
                      <Check className="w-4 h-4" />
                      <span className="text-[11px] font-semibold">Copied</span>
                    </div>
                  ) : (
                    <Copy className="w-4 h-4 text-gray-500 group-hover:text-gray-300 transition-colors" />
                  )}
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Loading state */}
        {!displayValue && tab !== "lightning" && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
          </div>
        )}

        {/* Hint for onchain */}
        {tab === "onchain" && displayValue && (
          <p className="text-center text-[11px] text-gray-600 mt-3">
            Open the wallet after confirmation to convert boarding funds into instant Bitcoin
          </p>
        )}
      </div>
    </div>
  );
}
