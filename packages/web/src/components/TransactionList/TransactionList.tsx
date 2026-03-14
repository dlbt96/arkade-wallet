import React from "react";
import { ArrowUpRight, ArrowDownLeft, Zap, Globe, Layers, Clock } from "lucide-react";
import { formatSats, formatTime, routeLabel, routeBadgeClass } from "../../lib/format";
import type { Transaction } from "../../hooks/useTransactions";

interface Props {
  transactions: Transaction[];
  loading: boolean;
}

export function TransactionList({ transactions, loading }: Props) {
  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[15px] font-semibold">Activity</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3.5 py-2">
              <div className="skeleton w-11 h-11 rounded-2xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-3.5 w-28" />
                <div className="skeleton h-3 w-16" />
              </div>
              <div className="skeleton h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-[15px] font-semibold">Activity</h3>
        {transactions.length > 0 && (
          <span className="text-[11px] text-gray-500 font-medium">
            {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-10">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.04] flex items-center justify-center mx-auto mb-4">
            <Clock className="w-6 h-6 text-gray-600" />
          </div>
          <p className="text-gray-400 text-sm font-medium">No activity yet</p>
          <p className="text-gray-600 text-[13px] mt-1">
            Your transactions will appear here
          </p>
        </div>
      ) : (
        <div className="divide-y divide-white/[0.03] -mx-6">
          {transactions.map((tx, i) => (
            <TransactionItem key={tx.id} tx={tx} isFirst={i === 0} isLast={i === transactions.length - 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function TransactionItem({
  tx,
  isFirst,
  isLast,
}: {
  tx: Transaction;
  isFirst: boolean;
  isLast: boolean;
}) {
  const isSend = tx.type === "send";
  const RouteIcon = tx.route === "lightning" ? Zap : tx.route === "onchain" ? Globe : Layers;

  return (
    <div className={`flex items-center gap-3.5 px-6 py-3.5 hover:bg-white/[0.02] transition-colors ${isFirst ? "pt-4" : ""} ${isLast ? "pb-4" : ""}`}>
      {/* Direction icon */}
      <div
        className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
          isSend
            ? "bg-red-500/8 border border-red-500/10"
            : "bg-emerald-500/8 border border-emerald-500/10"
        }`}
      >
        {isSend ? (
          <ArrowUpRight className="w-5 h-5 text-red-400" />
        ) : (
          <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-semibold">{isSend ? "Sent" : "Received"}</p>
          <span className={routeBadgeClass(tx.route)}>
            <RouteIcon className="w-2.5 h-2.5" />
            {routeLabel(tx.route)}
          </span>
        </div>
        <p className="text-[11px] text-gray-500 mt-0.5">{formatTime(tx.timestamp)}</p>
      </div>

      {/* Amount */}
      <p
        className={`text-[13px] font-mono font-semibold tabular-nums ${
          isSend ? "text-red-400" : "text-emerald-400"
        }`}
      >
        {isSend ? "\u2212" : "+"}{formatSats(tx.amount)}
      </p>
    </div>
  );
}
