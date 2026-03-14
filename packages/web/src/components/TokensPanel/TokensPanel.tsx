import React, { useState } from "react";
import { Coins, Plus, Send, ChevronDown, ChevronUp, X, Loader2, AlertCircle } from "lucide-react";
import { useTokens } from "../../hooks/useTokens";

export function TokensPanel() {
  const { tokens, loading, issueToken, transferToken } = useTokens();
  const [expanded, setExpanded] = useState(false);
  const [showIssue, setShowIssue] = useState(false);
  const [showTransfer, setShowTransfer] = useState<string | null>(null);

  return (
    <>
      <div className="card">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/15 flex items-center justify-center">
              <Coins className="w-[18px] h-[18px] text-purple-400" />
            </div>
            <div className="text-left">
              <h3 className="text-[15px] font-semibold">Assets</h3>
              <p className="text-[11px] text-gray-500">
                {tokens.length > 0 ? `${tokens.length} token${tokens.length !== 1 ? "s" : ""}` : "Issue & manage tokens"}
              </p>
            </div>
          </div>
          <div className="btn-ghost p-2">
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </div>
        </button>

        {expanded && (
          <div className="mt-5 space-y-3 animate-fade-in">
            {tokens.length === 0 && !loading ? (
              <div className="text-center py-6">
                <p className="text-gray-500 text-sm">No tokens issued yet</p>
                <p className="text-gray-600 text-[12px] mt-1">Create your first Bitcoin-native asset</p>
              </div>
            ) : (
              tokens.map((token) => (
                <div
                  key={token.assetId}
                  className="flex items-center justify-between bg-white/[0.03] hover:bg-white/[0.05] rounded-2xl p-4 border border-white/[0.04] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/10 flex items-center justify-center">
                      <span className="text-[13px] font-bold text-purple-400">
                        {token.ticker.slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold">
                        {token.name}
                        <span className="text-gray-500 font-normal ml-1.5">{token.ticker}</span>
                      </p>
                      <p className="font-mono text-[12px] text-gray-400">
                        {(token.balance / 10 ** token.decimals).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowTransfer(token.assetId)}
                    className="btn-ghost p-2"
                    title="Transfer"
                  >
                    <Send className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              ))
            )}

            <button
              onClick={() => setShowIssue(true)}
              className="btn-secondary w-full flex items-center justify-center gap-2 py-3"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">Issue New Token</span>
            </button>
          </div>
        )}
      </div>

      {/* Issue dialog */}
      {showIssue && (
        <IssueDialog onIssue={issueToken} onClose={() => setShowIssue(false)} />
      )}

      {/* Transfer dialog */}
      {showTransfer && (
        <TransferDialog
          assetId={showTransfer}
          onTransfer={transferToken}
          onClose={() => setShowTransfer(null)}
        />
      )}
    </>
  );
}

/* ── Issue Token Dialog ─────────────────────────────────── */

function IssueDialog({
  onIssue,
  onClose,
}: {
  onIssue: (p: { name: string; ticker: string; amount: number; decimals?: number }) => Promise<any>;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [ticker, setTicker] = useState("");
  const [amount, setAmount] = useState("");
  const [decimals, setDecimals] = useState("8");
  const [issuing, setIssuing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIssuing(true);
    setError(null);
    try {
      await onIssue({ name, ticker: ticker.toUpperCase(), amount: parseInt(amount, 10), decimals: parseInt(decimals, 10) });
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIssuing(false);
    }
  };

  return (
    <div className="glass-overlay flex items-center justify-center p-4" onClick={onClose}>
      <div className="dialog-panel p-7 animate-scale-in max-w-sm" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-5 right-5 btn-ghost p-2">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6 pr-8">
          <div className="w-11 h-11 rounded-2xl bg-purple-500/15 border border-purple-500/15 flex items-center justify-center">
            <Coins className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Issue Token</h3>
            <p className="text-[12px] text-gray-500">Create a Bitcoin-native asset</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[12px] text-gray-400 font-medium mb-1.5 ml-1">Token Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Token" className="input-field" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] text-gray-400 font-medium mb-1.5 ml-1">Ticker</label>
              <input value={ticker} onChange={(e) => setTicker(e.target.value)} placeholder="MTK" className="input-field font-mono" maxLength={8} />
            </div>
            <div>
              <label className="block text-[12px] text-gray-400 font-medium mb-1.5 ml-1">Decimals</label>
              <input type="number" value={decimals} onChange={(e) => setDecimals(e.target.value)} className="input-field font-mono" min={0} max={18} />
            </div>
          </div>
          <div>
            <label className="block text-[12px] text-gray-400 font-medium mb-1.5 ml-1">Total Supply</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="1,000,000" className="input-field font-mono" />
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-500/8 border border-red-500/12 rounded-xl p-3 mt-4">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <button onClick={handleSubmit} disabled={!name || !ticker || !amount || issuing} className="btn-primary w-full mt-5">
          {issuing ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Issue Token"}
        </button>
      </div>
    </div>
  );
}

/* ── Transfer Token Dialog ──────────────────────────────── */

function TransferDialog({
  assetId,
  onTransfer,
  onClose,
}: {
  assetId: string;
  onTransfer: (p: { address: string; assetId: string; amount: number }) => Promise<any>;
  onClose: () => void;
}) {
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setTransferring(true);
    setError(null);
    try {
      await onTransfer({ address, assetId, amount: parseInt(amount, 10) });
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTransferring(false);
    }
  };

  return (
    <div className="glass-overlay flex items-center justify-center p-4" onClick={onClose}>
      <div className="dialog-panel p-7 animate-scale-in max-w-sm" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-5 right-5 btn-ghost p-2">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6 pr-8">
          <div className="w-11 h-11 rounded-2xl bg-blue-500/15 border border-blue-500/15 flex items-center justify-center">
            <Send className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Transfer Token</h3>
            <p className="text-[12px] text-gray-500">Send to an Arkade address</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[12px] text-gray-400 font-medium mb-1.5 ml-1">Recipient</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="ark1..." className="input-field font-mono text-[13px]" autoFocus />
          </div>
          <div>
            <label className="block text-[12px] text-gray-400 font-medium mb-1.5 ml-1">Amount</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className="input-field font-mono" />
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-500/8 border border-red-500/12 rounded-xl p-3 mt-4">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <button onClick={handleSubmit} disabled={!address || !amount || transferring} className="btn-primary w-full mt-5">
          {transferring ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Transfer"}
        </button>
      </div>
    </div>
  );
}
