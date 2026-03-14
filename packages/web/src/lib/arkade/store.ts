import type { BrowserWalletState } from "./types";

export class BrowserWalletStore {
  private readonly storageKey: string;
  private state: BrowserWalletState | null = null;

  constructor(storageKey: string) {
    this.storageKey = storageKey;
  }

  exists(): boolean {
    return this.load() !== null;
  }

  load(): BrowserWalletState | null {
    if (typeof window === "undefined") return null;

    try {
      const raw = window.localStorage.getItem(this.storageKey);
      if (!raw) return null;

      this.state = JSON.parse(raw) as BrowserWalletState;
      return this.state;
    } catch {
      return null;
    }
  }

  save(state: BrowserWalletState): void {
    if (typeof window === "undefined") return;

    this.state = state;
    window.localStorage.setItem(this.storageKey, JSON.stringify(state));
  }

  clear(): void {
    if (typeof window === "undefined") return;

    this.state = null;
    window.localStorage.removeItem(this.storageKey);
  }

  getState(): BrowserWalletState | null {
    return this.state || this.load();
  }
}
