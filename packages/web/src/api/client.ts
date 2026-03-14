import { browserWalletEngine } from "../lib/arkade/engine";
import type {
  CreateWalletResult,
  LightningInvoiceLimits,
  ReceiveAddresses,
  SendResult,
  TokenBalance,
  TokenInfo,
  TokenIssueParams,
  TokenTransferParams,
  UnifiedBalance,
  UnifiedTransaction,
  WalletStatus,
} from "../lib/arkade/types";

export type {
  CreateWalletResult,
  LightningInvoiceLimits,
  SendResult,
  TokenBalance,
  TokenInfo,
  TokenIssueParams,
  TokenTransferParams,
  UnifiedBalance,
  WalletStatus,
};

export interface Addresses extends ReceiveAddresses {}

export const api = {
  getStatus: (): Promise<WalletStatus> => browserWalletEngine.getStatus(),

  createWallet: (): Promise<CreateWalletResult> => browserWalletEngine.createWallet(),

  importWallet: (mnemonic: string) =>
    browserWalletEngine.importWallet(mnemonic).then(() => ({ success: true })),

  getBalance: (): Promise<UnifiedBalance> => browserWalletEngine.getBalance(),

  getAddresses: (): Promise<Addresses> => browserWalletEngine.getAddresses(),

  send: (destination: string, amountSats: number): Promise<SendResult> =>
    browserWalletEngine.send(destination, amountSats),

  previewSend: (destination: string) => browserWalletEngine.previewSend(destination),

  createInvoice: (amountSats: number, description?: string) =>
    browserWalletEngine.createInvoice(amountSats, description),

  getLightningInvoiceLimits: (): Promise<LightningInvoiceLimits> =>
    browserWalletEngine.getLightningInvoiceLimits(),

  getReceiveAddresses: () => browserWalletEngine.getReceiveAddresses(),

  getTransactions: () =>
    browserWalletEngine.getTransactions().then((transactions: UnifiedTransaction[]) => ({
      transactions: transactions.map((tx) => ({
        ...tx,
        timestamp: tx.timestamp,
      })),
    })),

  issueToken: (params: TokenIssueParams): Promise<TokenInfo> =>
    browserWalletEngine.issueToken(params),

  transferToken: (params: TokenTransferParams) =>
    browserWalletEngine.transferToken(params).then((txid) => ({ txid })),

  getTokenBalances: () =>
    browserWalletEngine.getTokenBalances().then((balances: TokenBalance[]) => ({
      balances,
    })),
};
