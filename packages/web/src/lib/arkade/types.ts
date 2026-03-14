export type PaymentRoute = "ark" | "lightning" | "onchain";
export type ArkadeNetwork = "bitcoin" | "mutinynet" | "signet" | "regtest";

export interface WalletStatus {
  initialized: boolean;
  hasWallet: boolean;
}

export interface CreateWalletResult {
  success: boolean;
  isNew: boolean;
  mnemonic?: string;
}

export interface UnifiedBalance {
  availableSats: number;
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
  route: PaymentRoute;
  amount: number;
  timestamp: string;
  status: string;
}

export interface ReceiveAddresses {
  ark: string;
  boarding: string;
}

export interface LightningInvoiceResult {
  invoice: string;
  paymentHash: string;
  amount: number;
}

export interface LightningInvoiceLimits {
  min: number;
  max: number;
}

export interface ReceiveAddressesResponse {
  instant: { address: string; label: string; description: string };
  onchain: { address: string; label: string; description: string };
}

export interface TokenIssueParams {
  name: string;
  ticker: string;
  amount: number;
  decimals?: number;
}

export interface TokenTransferParams {
  address: string;
  assetId: string;
  amount: number;
}

export interface TokenInfo {
  id: string;
  name: string;
  ticker: string;
  amount: number;
  decimals: number;
}

export interface TokenBalance {
  assetId: string;
  name: string;
  ticker: string;
  balance: number;
  decimals: number;
}

export interface TokenSupportStatus {
  supported: boolean;
  reason?: string;
}

export interface SendResult {
  txid: string;
  route: PaymentRoute;
  amount: number;
  fee?: number;
}

export interface DetectedDestination {
  type: PaymentRoute;
  address?: string;
  invoice?: string;
  invoiceAmountSats?: number;
}

export interface BrowserWalletState {
  mnemonic?: string;
  privateKeyHex?: string;
  network: ArkadeNetwork;
  arkServerUrl: string;
  createdAt: string;
}
