import React, { useState } from "react";
import { Eye, EyeOff, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { formatSats, formatBtc } from "../../lib/format";
import type { UnifiedBalance } from "../../api/client";

interface Props {
  balance: UnifiedBalance | null;
  loading: boolean;
  onRefresh: () => void;
}

export function BalanceCard({ balance, loading, onRefresh }: Props) {
  const [showDetails, setShowDetails] = useState(false);
  const [hidden, setHidden] = useState(false);
  const sats = balance?.availableSats ?? 0;

  return (
    <div className="card relative overflow-hidden">
      {/* Background gradient glow */}
      <div className="absolute -top-32 -right-32 w-72 h-72 bg-orange-500/[0.06] rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-amber-500/[0.04] rounded-full blur-[60px] pointer-events-none" />

      <div className="relative">
        {/* Header row */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5">
            {/* Bitcoin icon */}
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/15 flex items-center justify-center">
              <svg className="w-[18px] h-[18px] text-orange-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14.24 10.56C13.93 8.7 12.18 8.15 10.07 7.86l.34-2.27-1.38-.21-.33 2.21c-.36-.06-.73-.1-1.1-.16l.34-2.22-1.38-.21-.34 2.27c-.3-.05-.6-.11-.88-.17l-1.9-.29-.22 1.48s1.02.24 1 .25c.56.14.66.5.64.79l-.65 4.32c-.04.18-.17.46-.52.37.01.02-1-.25-1-.25L2 15.59l1.8.45c.33.08.66.17.98.25l-.35 2.3 1.38.21.34-2.28c.38.08.75.15 1.11.22l-.33 2.27 1.38.21.35-2.29c2.37.45 4.14.27 4.89-1.87.6-1.73-.03-2.73-1.28-3.38.91-.21 1.6-.81 1.78-2.04zm-3.18 4.46c-.43 1.73-3.3.8-4.23.56l.75-5.02c.94.23 3.93.7 3.48 4.46zm.43-4.48c-.39 1.57-2.78.77-3.55.58l.68-4.55c.78.19 3.28.55 2.87 3.97z"/>
              </svg>
            </div>
            <span className="text-sm text-gray-400 font-medium">Bitcoin Balance</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setHidden(!hidden)}
              className="btn-ghost p-2"
              title={hidden ? "Show balance" : "Hide balance"}
            >
              {hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button
              onClick={onRefresh}
              disabled={loading}
              className="btn-ghost p-2"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-orange-400" : ""}`} />
            </button>
          </div>
        </div>

        {/* Main balance */}
        <div className="text-center mb-2">
          {loading && !balance ? (
            <div className="skeleton h-14 w-48 mx-auto mb-3" />
          ) : hidden ? (
            <p className="text-5xl font-extrabold tracking-tight text-gray-600">
              ••••••
            </p>
          ) : (
            <>
              <p className="text-[48px] font-extrabold tracking-tight leading-none">
                {formatSats(sats)}
              </p>
              {sats > 0 && (
                <p className="text-gray-500 mt-2.5 text-sm font-mono tracking-wide">
                  {formatBtc(sats)} BTC
                </p>
              )}
            </>
          )}
        </div>

        {/* Details toggle */}
        {balance && !hidden && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="mx-auto flex items-center gap-1 text-[12px] text-gray-500 hover:text-gray-300 transition-colors mt-4"
          >
            Details
            {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}

        {/* Details breakdown */}
        {showDetails && balance && !hidden && (
          <div className="mt-4 pt-4 border-t border-white/[0.04] grid grid-cols-2 gap-2.5 animate-fade-in">
            <DetailItem label="Settled" value={balance.details.settled} color="text-emerald-400" />
            <DetailItem label="Preconfirmed" value={balance.details.preconfirmed} color="text-amber-400" />
            <DetailItem label="Recoverable" value={balance.details.recoverable} color="text-gray-400" />
            <DetailItem
              label="Boarding"
              value={balance.details.boardingTotal}
              color="text-blue-400"
              hint={balance.details.boardingTotal > 0 ? "Auto-converting..." : undefined}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
  color = "text-gray-300",
  hint,
}: {
  label: string;
  value: number;
  color?: string;
  hint?: string;
}) {
  return (
    <div className="bg-white/[0.03] rounded-xl px-3.5 py-2.5 border border-white/[0.03]">
      <p className="text-[11px] text-gray-500 font-medium">{label}</p>
      <p className={`font-mono text-sm font-medium mt-0.5 ${color}`}>{formatSats(value)}</p>
      {hint && <p className="text-[10px] text-gray-600 mt-0.5">{hint}</p>}
    </div>
  );
}
