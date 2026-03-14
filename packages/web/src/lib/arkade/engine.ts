import { TxType, Wallet, type Identity } from "@arkade-os/sdk";
import { IndexedDBStorageAdapter } from "@arkade-os/sdk/adapters/indexedDB";
import { ArkadeLightning, BoltzSwapProvider } from "@arkade-os/boltz-swap";
import { loadConfig } from "./config";
import { loadOrCreateIdentity, importFromMnemonic } from "./identity";
import { PaymentRouter } from "./payments/router";
import { detectDestination } from "./payments/detector";
import { ReceiveManager } from "./receive/manager";
import { BrowserWalletStore } from "./store";
import { Scheduler } from "./automation/scheduler";
import { TokenManager } from "./tokens/manager";
import type {
  CreateWalletResult,
  LightningInvoiceLimits,
  LightningInvoiceResult,
  ReceiveAddresses,
  ReceiveAddressesResponse,
  SendResult,
  TokenBalance,
  TokenInfo,
  TokenIssueParams,
  TokenTransferParams,
  UnifiedBalance,
  UnifiedTransaction,
  WalletStatus,
} from "./types";

class BrowserWalletEngine {
  private wallet: Wallet | null = null;
  private lightning: ArkadeLightning | null = null;
  private paymentRouter: PaymentRouter | null = null;
  private receiveManager: ReceiveManager | null = null;
  private tokenManager: TokenManager | null = null;
  private scheduler: Scheduler | null = null;
  private store = new BrowserWalletStore(loadConfig().walletStorageKey);
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;

  async getStatus(): Promise<WalletStatus> {
    if (this.store.exists() && !this.initialized) {
      try {
        await this.initializeExistingWallet();
      } catch (err) {
        console.error("[BrowserWalletEngine] Failed to restore wallet:", err);
      }
    }

    return {
      initialized: this.initialized,
      hasWallet: this.store.exists(),
    };
  }

  async createWallet(): Promise<CreateWalletResult> {
    if (this.initialized || this.store.exists()) {
      throw new Error("Wallet already initialized");
    }

    const config = this.resetConfig();
    const identityResult = loadOrCreateIdentity(this.store);

    await this.clearSdkState();
    await this.setupWallet(identityResult.identity);

    this.store.save({
      mnemonic: identityResult.mnemonic,
      privateKeyHex: identityResult.privateKeyHex,
      network: config.network,
      arkServerUrl: config.arkServerUrl,
      createdAt: new Date().toISOString(),
    });

    return {
      success: true,
      isNew: true,
      mnemonic: identityResult.mnemonic,
    };
  }

  async importWallet(mnemonic: string): Promise<void> {
    const config = this.resetConfig();
    const identityResult = importFromMnemonic(mnemonic);

    await this.shutdown();
    await this.clearSdkState();

    this.store.save({
      mnemonic: identityResult.mnemonic,
      privateKeyHex: identityResult.privateKeyHex,
      network: config.network,
      arkServerUrl: config.arkServerUrl,
      createdAt: new Date().toISOString(),
    });

    await this.setupWallet(identityResult.identity);
  }

  async getBalance(): Promise<UnifiedBalance> {
    const wallet = await this.ensureWallet();
    const balance = await wallet.getBalance();

    return {
      availableSats: balance.available ?? 0,
      details: {
        settled: balance.settled ?? 0,
        preconfirmed: balance.preconfirmed ?? 0,
        available: balance.available ?? 0,
        recoverable: balance.recoverable ?? 0,
        boardingConfirmed: balance.boarding?.confirmed ?? 0,
        boardingUnconfirmed: balance.boarding?.unconfirmed ?? 0,
        boardingTotal: balance.boarding?.total ?? 0,
        total: balance.total ?? 0,
      },
    };
  }

  async getAddresses(): Promise<ReceiveAddresses> {
    await this.ensureInitialized();
    return this.receiveManager!.getAddresses();
  }

  async getReceiveAddresses(): Promise<ReceiveAddressesResponse> {
    const addresses = await this.getAddresses();

    return {
      instant: {
        address: addresses.ark,
        label: "Instant (Arkade)",
        description: "Receive Bitcoin instantly through Arkade.",
      },
      onchain: {
        address: addresses.boarding,
        label: "Onchain",
        description: "Receive onchain BTC and convert it after confirmation.",
      },
    };
  }

  async send(destination: string, amountSats: number): Promise<SendResult> {
    await this.ensureInitialized();
    return this.paymentRouter!.send(destination, amountSats);
  }

  previewSend(destination: string) {
    return detectDestination(destination);
  }

  async createInvoice(
    amountSats: number,
    description?: string
  ): Promise<LightningInvoiceResult> {
    await this.ensureInitialized();
    return this.receiveManager!.createInvoice(amountSats, description);
  }

  async getLightningInvoiceLimits(): Promise<LightningInvoiceLimits> {
    await this.ensureInitialized();
    return this.receiveManager!.getInvoiceLimits();
  }

  async getTransactions(): Promise<UnifiedTransaction[]> {
    const wallet = await this.ensureWallet();
    const transactions = await wallet.getTransactionHistory();

    return transactions
      .map((tx) => ({
        id: tx.key.arkTxid || tx.key.commitmentTxid || tx.key.boardingTxid,
        type: tx.type === TxType.TxReceived ? ("receive" as const) : ("send" as const),
        route: "ark" as const,
        amount: Math.abs(tx.amount),
        timestamp: new Date(tx.createdAt).toISOString(),
        status: tx.settled ? "confirmed" : "pending",
      }))
      .sort((left, right) => right.timestamp.localeCompare(left.timestamp));
  }

  async issueToken(params: TokenIssueParams): Promise<TokenInfo> {
    await this.ensureInitialized();
    return this.tokenManager!.issue(params);
  }

  async transferToken(params: TokenTransferParams): Promise<string> {
    await this.ensureInitialized();
    return this.tokenManager!.transfer(params);
  }

  async getTokenBalances(): Promise<TokenBalance[]> {
    await this.ensureInitialized();
    return this.tokenManager!.getBalances();
  }

  async shutdown(): Promise<void> {
    this.scheduler?.stop();
    this.scheduler = null;

    await this.lightning?.dispose();
    this.lightning = null;

    this.paymentRouter = null;
    this.receiveManager = null;
    this.tokenManager = null;
    this.wallet = null;
    this.initialized = false;
    this.initializationPromise = null;
  }

  private async ensureWallet(): Promise<Wallet> {
    await this.ensureInitialized();
    return this.wallet!;
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;

    if (!this.store.exists()) {
      throw new Error("Wallet not initialized. Create or import a wallet first.");
    }

    if (!this.initializationPromise) {
      this.initializationPromise = this.initializeExistingWallet();
    }

    await this.initializationPromise;
  }

  private async initializeExistingWallet(): Promise<void> {
    const identityResult = loadOrCreateIdentity(this.store);
    await this.setupWallet(identityResult.identity);
  }

  private async setupWallet(identity: Identity): Promise<void> {
    const config = this.resetConfig();
    const storage = new IndexedDBStorageAdapter(config.walletDbName, 1);
    const wallet = await Wallet.create({
      identity,
      arkServerUrl: config.arkServerUrl,
      storage,
      ...(config.esploraUrl ? { esploraUrl: config.esploraUrl } : {}),
    });

    const swapProvider = new BoltzSwapProvider({
      apiUrl: config.boltzApiUrl,
      network: config.network,
      referralId: "arkade-wallet",
    });

    const lightning = new ArkadeLightning({
      wallet,
      swapProvider,
      swapManager: true,
    });

    this.wallet = wallet;
    this.lightning = lightning;
    this.paymentRouter = new PaymentRouter(wallet, lightning);
    this.receiveManager = new ReceiveManager(wallet, lightning);
    this.tokenManager = new TokenManager(wallet);
    this.scheduler = new Scheduler(wallet, {
      onboardIntervalMs: config.onboardIntervalMs,
      renewalIntervalMs: config.renewalIntervalMs,
      renewalThresholdSecs: config.renewalThresholdSecs,
    });
    this.scheduler.start();
    this.initialized = true;
    this.initializationPromise = null;

    console.log(`[BrowserWalletEngine] Wallet ready on ${config.network}`);
  }

  private async clearSdkState(): Promise<void> {
    const config = this.resetConfig();
    const storage = new IndexedDBStorageAdapter(config.walletDbName, 1);
    await storage.clear();
  }

  private resetConfig() {
    const config = loadConfig();
    this.store = new BrowserWalletStore(config.walletStorageKey);
    return config;
  }
}

export const browserWalletEngine = new BrowserWalletEngine();
