import React, { useState } from "react";
import { api } from "../../api/client";
import { Wallet, Key, Copy, Check, ArrowLeft, Shield, Loader2, Download } from "lucide-react";

interface Props {
  onCreated: () => void;
}

export function CreateWallet({ onCreated }: Props) {
  const [mode, setMode] = useState<"choose" | "creating" | "backup" | "import">("choose");
  const [mnemonic, setMnemonic] = useState("");
  const [importMnemonic, setImportMnemonic] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    setMode("creating");
    setError(null);
    try {
      const result = await api.createWallet();
      if (result.mnemonic) {
        setMnemonic(result.mnemonic);
        setMode("backup");
      } else {
        onCreated();
      }
    } catch (err: any) {
      setError(err.message);
      setMode("choose");
    }
  };

  const handleImport = async () => {
    setError(null);
    try {
      await api.importWallet(importMnemonic.trim());
      onCreated();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const copyMnemonic = () => {
    navigator.clipboard.writeText(mnemonic);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Backup screen ──────────────────────────────────────
  if (mode === "backup") {
    return (
      <div className="min-h-screen flex items-center justify-center p-5">
        {/* Subtle background glow */}
        <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="dialog-panel p-8 animate-scale-in">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-5">
              <Key className="w-7 h-7 text-amber-400" />
            </div>
            <h2 className="text-2xl font-bold">Recovery Phrase</h2>
            <p className="text-gray-400 mt-2 text-sm leading-relaxed max-w-xs mx-auto">
              Write down these 12 words in order. This is the <span className="text-gray-300">only way</span> to recover your wallet.
            </p>
          </div>

          <div className="bg-white/[0.04] rounded-2xl p-5 border border-white/[0.06] mb-5">
            <div className="grid grid-cols-3 gap-x-4 gap-y-3">
              {mnemonic.split(" ").map((word, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-gray-600 text-[11px] font-mono w-4 text-right">{i + 1}</span>
                  <span className="text-white font-mono text-sm font-medium">{word}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={copyMnemonic}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all text-sm text-gray-400 hover:text-gray-200 mb-5"
          >
            {copied ? (
              <><Check className="w-4 h-4 text-emerald-400" /><span className="text-emerald-400">Copied to clipboard</span></>
            ) : (
              <><Copy className="w-4 h-4" /><span>Copy to clipboard</span></>
            )}
          </button>

          <div className="bg-red-500/8 border border-red-500/15 rounded-2xl p-4 mb-6">
            <div className="flex gap-3">
              <Shield className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400/90 text-[13px] leading-relaxed">
                Never share your recovery phrase. Anyone with these words controls your Bitcoin.
              </p>
            </div>
          </div>

          <button onClick={onCreated} className="btn-primary w-full">
            I've Saved My Backup
          </button>
        </div>
      </div>
    );
  }

  // ── Import screen ──────────────────────────────────────
  if (mode === "import") {
    return (
      <div className="min-h-screen flex items-center justify-center p-5">
        <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="dialog-panel p-8 animate-scale-in">
          <button
            onClick={() => { setMode("choose"); setError(null); }}
            className="btn-ghost mb-6 -ml-1 flex items-center gap-1.5 text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-5">
              <Download className="w-7 h-7 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold">Import Wallet</h2>
            <p className="text-gray-400 mt-2 text-sm">Enter your 12-word recovery phrase</p>
          </div>

          <textarea
            value={importMnemonic}
            onChange={(e) => setImportMnemonic(e.target.value)}
            placeholder="abandon ability able about above absent..."
            className="input-field h-32 resize-none font-mono text-sm mb-4"
            autoFocus
          />

          {error && (
            <div className="bg-red-500/8 border border-red-500/15 rounded-xl p-3 mb-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleImport}
            disabled={importMnemonic.trim().split(/\s+/).length < 12}
            className="btn-primary w-full"
          >
            Import Wallet
          </button>
        </div>
      </div>
    );
  }

  // ── Welcome / Choose screen ────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center p-5">
      {/* Background glow */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="dialog-panel p-8 animate-slide-up">
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-orange-500/25">
            <Wallet className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Arkade</h1>
          <p className="text-gray-400 mt-3 text-[15px] leading-relaxed max-w-[280px] mx-auto">
            Instant Bitcoin payments.<br />
            Self-custodial and stored in this browser.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: "Instant", desc: "< 1 second", color: "text-orange-400" },
            { label: "Lightning", desc: "Compatible", color: "text-yellow-400" },
            { label: "Onchain", desc: "Supported", color: "text-blue-400" },
          ].map((f) => (
            <div key={f.label} className="text-center bg-white/[0.03] rounded-2xl py-3 px-2 border border-white/[0.04]">
              <p className={`text-sm font-semibold ${f.color}`}>{f.label}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{f.desc}</p>
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-500/8 border border-red-500/15 rounded-xl p-3 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleCreate}
            disabled={mode === "creating"}
            className="btn-primary w-full py-4 text-[15px]"
          >
            {mode === "creating" ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Creating...
              </span>
            ) : (
              "Create New Wallet"
            )}
          </button>
          <button onClick={() => setMode("import")} className="btn-secondary w-full py-3.5">
            Import Existing Wallet
          </button>
        </div>

        <p className="text-center text-gray-600 text-[11px] mt-8">
          Powered by the <span className="text-gray-500">Ark protocol</span> on Bitcoin
        </p>
      </div>
    </div>
  );
}
