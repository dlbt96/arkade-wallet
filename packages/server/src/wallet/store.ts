import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export interface WalletState {
  mnemonic?: string;
  privateKeyHex?: string;
  network: string;
  arkServerUrl: string;
  createdAt: string;
  pendingSwaps: PendingSwapRecord[];
}

export interface PendingSwapRecord {
  id: string;
  type: "submarine" | "reverse";
  status: string;
  createdAt: string;
  invoice?: string;
  amount?: number;
}

export class WalletStore {
  private filePath: string;
  private state: WalletState | null = null;

  constructor(dataDir: string) {
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }
    this.filePath = join(dataDir, "state.json");
  }

  exists(): boolean {
    return existsSync(this.filePath);
  }

  load(): WalletState | null {
    if (!this.exists()) return null;
    try {
      const raw = readFileSync(this.filePath, "utf-8");
      this.state = JSON.parse(raw);
      return this.state;
    } catch {
      return null;
    }
  }

  save(state: WalletState): void {
    this.state = state;
    writeFileSync(this.filePath, JSON.stringify(state, null, 2), "utf-8");
  }

  update(partial: Partial<WalletState>): void {
    const current = this.load() || ({} as WalletState);
    this.save({ ...current, ...partial });
  }

  addPendingSwap(swap: PendingSwapRecord): void {
    const state = this.load();
    if (!state) return;
    state.pendingSwaps = state.pendingSwaps || [];
    state.pendingSwaps.push(swap);
    this.save(state);
  }

  removePendingSwap(id: string): void {
    const state = this.load();
    if (!state) return;
    state.pendingSwaps = (state.pendingSwaps || []).filter((s) => s.id !== id);
    this.save(state);
  }

  getState(): WalletState | null {
    return this.state || this.load();
  }
}
