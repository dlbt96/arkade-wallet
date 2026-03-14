import type { Wallet } from "@arkade-os/sdk";
import type { TokenIssueParams, TokenTransferParams, TokenInfo, TokenBalance } from "./types.js";

/**
 * TokenManager wraps wallet.assetManager for issuing, transferring,
 * and querying Bitcoin-native assets on Arkade VTXOs.
 */
export class TokenManager {
  private wallet: Wallet;

  constructor(wallet: Wallet) {
    this.wallet = wallet;
  }

  /**
   * Issue a new token. Returns the created asset info.
   */
  async issue(params: TokenIssueParams): Promise<TokenInfo> {
    const assetManager = (this.wallet as any).assetManager;
    if (!assetManager) {
      throw new Error("Asset manager not available on this wallet instance");
    }

    const result = await assetManager.issue({
      amount: params.amount,
      name: params.name,
      ticker: params.ticker,
      decimals: params.decimals ?? 8,
    });

    return {
      id: result.id,
      name: params.name,
      ticker: params.ticker,
      amount: params.amount,
      decimals: params.decimals ?? 8,
    };
  }

  /**
   * Transfer tokens to another Arkade address.
   */
  async transfer(params: TokenTransferParams): Promise<string> {
    const assetManager = (this.wallet as any).assetManager;
    if (!assetManager) {
      throw new Error("Asset manager not available on this wallet instance");
    }

    const txid = await assetManager.transfer({
      address: params.address,
      assetId: params.assetId,
      amount: params.amount,
    });

    return txid;
  }

  /**
   * Get all token balances for the wallet.
   */
  async getBalances(): Promise<TokenBalance[]> {
    const assetManager = (this.wallet as any).assetManager;
    if (!assetManager) {
      throw new Error("Asset manager not available on this wallet instance");
    }

    const balances = await assetManager.getBalances();

    return balances.map((b: any) => ({
      assetId: b.assetId || b.id,
      name: b.name || "Unknown",
      ticker: b.ticker || "???",
      balance: b.balance || b.amount || 0,
      decimals: b.decimals ?? 8,
    }));
  }
}
