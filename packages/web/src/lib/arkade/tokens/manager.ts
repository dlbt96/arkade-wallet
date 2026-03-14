import type { Wallet } from "@arkade-os/sdk";
import type { TokenBalance, TokenInfo, TokenIssueParams, TokenTransferParams } from "../types";

export class TokenManager {
  private readonly wallet: Wallet;

  constructor(wallet: Wallet) {
    this.wallet = wallet;
  }

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

  async transfer(params: TokenTransferParams): Promise<string> {
    const assetManager = (this.wallet as any).assetManager;
    if (!assetManager) {
      throw new Error("Asset manager not available on this wallet instance");
    }

    return assetManager.transfer({
      address: params.address,
      assetId: params.assetId,
      amount: params.amount,
    });
  }

  async getBalances(): Promise<TokenBalance[]> {
    const assetManager = (this.wallet as any).assetManager;
    if (!assetManager) {
      throw new Error("Asset manager not available on this wallet instance");
    }

    const balances = await assetManager.getBalances();

    return balances.map((balance: any) => ({
      assetId: balance.assetId || balance.id,
      name: balance.name || "Unknown",
      ticker: balance.ticker || "???",
      balance: balance.balance || balance.amount || 0,
      decimals: balance.decimals ?? 8,
    }));
  }
}
