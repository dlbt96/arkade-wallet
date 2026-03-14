import { Wallet } from "@arkade-os/sdk";
import { ArkadeLightning, BoltzSwapProvider } from "@arkade-os/boltz-swap";
import type { AppConfig } from "../config.js";
import { WalletStore } from "./store.js";
import { loadOrCreateIdentity, importFromMnemonic, importFromPrivateKey } from "./identity.js";
import { PaymentRouter } from "../payments/router.js";
import { ReceiveManager } from "../receive/manager.js";
import { FundMonitor } from "../receive/monitor.js";
import { TokenManager } from "../tokens/manager.js";
import { Scheduler } from "../automation/scheduler.js";
import type { SendResult } from "../payments/types.js";
import type { TokenIssueParams, TokenTransferParams, TokenBalance, TokenInfo } from "../tokens/types.js";

export interface UnifiedBalance {
  /** Total spendable balance in sats */
  availableSats: number;
  /** Breakdown for advanced users */
  details: {
    settled: number;
    preconfirmed: number;
    available: number;
    recoverable: number;
    boardingConfirmed: number;
    boardingUnconfirmed: number;
    boardingTotal: number;
    total: number;
  };
}

export interface UnifiedTransaction {
  id: string;
  type: "send" | "receive";
  route: "ark" | "lightning" | "onchain";
  amount: number;
  timestamp: Date;
  status: string;
}

/**
 * WalletEngine is the central singleton that holds the SDK wallet instance
 * and exposes all high-level operations. The private key never leaves this module.
 */
export class WalletEngine {
  private wallet!: Wallet;
  private lightning!: ArkadeLightning;
  private paymentRouter!: PaymentRouter;
  private receiveManager!: ReceiveManager;
  private fundMonitor!: FundMonitor;
  private tokenManager!: TokenManager;
  private scheduler!: Scheduler;
  private store: WalletStore;
  private config: AppConfig;
  private initialized = false;

  constructor(config: AppConfig) {
    this.config = config;
    this.store = new WalletStore(config.dataDir);
  }

  get isInitialized(): boolean {
    return this.initialized;
  }

  hasExistingWallet(): boolean {
    return this.store.exists();
  }

  /**
   * Initialize the wallet engine. Loads existing wallet or creates a new one.
   */
  async initialize(): Promise<{ isNew: boolean; mnemonic?: string }> {
    const isNew = !this.store.exists();
    const identityResult = loadOrCreateIdentity(this.store);

    // Create the SDK wallet
    this.wallet = await Wallet.create({
      identity: identityResult.identity,
      arkServerUrl: this.config.arkServerUrl,
    });

    // Persist wallet state if new
    if (isNew) {
      this.store.save({
        mnemonic: identityResult.mnemonic,
        privateKeyHex: identityResult.privateKeyHex,
        network: this.config.network,
        arkServerUrl: this.config.arkServerUrl,
        createdAt: new Date().toISOString(),
        pendingSwaps: [],
      });
    }

    // Initialize Lightning via Boltz
    const swapProvider = new BoltzSwapProvider({
      apiUrl: this.config.boltzApiUrl,
      network: this.config.network as any,
    });
    this.lightning = new ArkadeLightning({
      wallet: this.wallet,
      swapProvider,
    });

    // Initialize all subsystems
    this.paymentRouter = new PaymentRouter(this.wallet, this.lightning);
    this.receiveManager = new ReceiveManager(this.wallet, this.lightning);
    this.fundMonitor = new FundMonitor(this.wallet);
    this.tokenManager = new TokenManager(this.wallet);
    this.scheduler = new Scheduler(this.wallet, {
      onboardIntervalMs: this.config.onboardIntervalMs,
      renewalIntervalMs: this.config.renewalIntervalMs,
      renewalThresholdSecs: this.config.renewalThresholdSecs,
    });

    // Start background services
    await this.fundMonitor.start();
    this.scheduler.start();

    this.initialized = true;

    const address = await this.wallet.getAddress();
    console.log(`[WalletEngine] Initialized. Ark address: ${address}`);
    console.log(`[WalletEngine] Network: ${this.config.network} | Server: ${this.config.arkServerUrl}`);

    return {
      isNew,
      mnemonic: isNew ? identityResult.mnemonic : undefined,
    };
  }

  /**
   * Import a wallet from a mnemonic phrase
   */
  async importWallet(mnemonic: string): Promise<void> {
    const identityResult = importFromMnemonic(mnemonic);

    this.wallet = await Wallet.create({
      identity: identityResult.identity,
      arkServerUrl: this.config.arkServerUrl,
    });

    this.store.save({
      mnemonic: identityResult.mnemonic,
      network: this.config.network,
      arkServerUrl: this.config.arkServerUrl,
      createdAt: new Date().toISOString(),
      pendingSwaps: [],
    });

    // Re-initialize subsystems
    const swapProvider = new BoltzSwapProvider({
      apiUrl: this.config.boltzApiUrl,
      network: this.config.network as any,
    });
    this.lightning = new ArkadeLightning({ wallet: this.wallet, swapProvider });
    this.paymentRouter = new PaymentRouter(this.wallet, this.lightning);
    this.receiveManager = new ReceiveManager(this.wallet, this.lightning);
    this.fundMonitor = new FundMonitor(this.wallet);
    this.tokenManager = new TokenManager(this.wallet);

    await this.fundMonitor.start();
    this.initialized = true;
  }

  // ── Balance ────────────────────────────────────────────────

  async getBalance(): Promise<UnifiedBalance> {
    this.ensureInitialized();
    const b = await this.wallet.getBalance();

    return {
      availableSats: b.available ?? 0,
      details: {
        settled: b.settled ?? 0,
        preconfirmed: b.preconfirmed ?? 0,
        available: b.available ?? 0,
        recoverable: b.recoverable ?? 0,
        boardingConfirmed: b.boarding?.confirmed ?? 0,
        boardingUnconfirmed: b.boarding?.unconfirmed ?? 0,
        boardingTotal: b.boarding?.total ?? 0,
        total: b.total ?? 0,
      },
    };
  }

  // ── Addresses ──────────────────────────────────────────────

  async getAddresses() {
    this.ensureInitialized();
    return this.receiveManager.getAddresses();
  }

  // ── Send ───────────────────────────────────────────────────

  async send(destination: string, amountSats: number): Promise<SendResult> {
    this.ensureInitialized();
    return this.paymentRouter.send(destination, amountSats);
  }

  previewSend(destination: string) {
    this.ensureInitialized();
    return this.paymentRouter.preview(destination);
  }

  // ── Receive ────────────────────────────────────────────────

  async createInvoice(amountSats: number, description?: string) {
    this.ensureInitialized();
    return this.receiveManager.createInvoice(amountSats, description);
  }

  // ── Transactions ───────────────────────────────────────────

  async getTransactions(): Promise<UnifiedTransaction[]> {
    this.ensureInitialized();
    const transactions: UnifiedTransaction[] = [];

    try {
      const arkTxs = await (this.wallet as any).getTransactionHistory?.();
      if (Array.isArray(arkTxs)) {
        for (const tx of arkTxs) {
          transactions.push({
            id: tx.txid || tx.id,
            type: tx.amount > 0 ? "receive" : "send",
            route: "ark",
            amount: Math.abs(tx.amount),
            timestamp: new Date(tx.createdAt || tx.timestamp || Date.now()),
            status: tx.status || "confirmed",
          });
        }
      }
    } catch {
      // Transaction history may not be available on all SDK versions
    }

    // Sort by timestamp, newest first
    transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return transactions;
  }

  // ── VTXOs ──────────────────────────────────────────────────

  async getVtxos() {
    this.ensureInitialized();
    return this.wallet.getVtxos();
  }

  // ── Tokens ─────────────────────────────────────────────────

  async issueToken(params: TokenIssueParams): Promise<TokenInfo> {
    this.ensureInitialized();
    return this.tokenManager.issue(params);
  }

  async transferToken(params: TokenTransferParams): Promise<string> {
    this.ensureInitialized();
    return this.tokenManager.transfer(params);
  }

  async getTokenBalances(): Promise<TokenBalance[]> {
    this.ensureInitialized();
    return this.tokenManager.getBalances();
  }

  // ── Lifecycle ──────────────────────────────────────────────

  async shutdown(): Promise<void> {
    this.scheduler?.stop();
    this.fundMonitor?.stop();
    console.log("[WalletEngine] Shut down.");
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error("Wallet not initialized. Call initialize() first.");
    }
  }
}
