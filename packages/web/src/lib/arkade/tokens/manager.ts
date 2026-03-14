import type { Wallet } from "@arkade-os/sdk";
import type {
  TokenBalance,
  TokenInfo,
  TokenIssueParams,
  TokenSupportStatus,
  TokenTransferParams,
} from "../types";

const TOKEN_UNSUPPORTED_REASON =
  "Token issuance is not available in this browser wallet build with the current Arkade SDK.";

export class TokenManager {
  private readonly wallet: Wallet;

  constructor(wallet: Wallet) {
    this.wallet = wallet;
  }

  getSupportStatus(): TokenSupportStatus {
    const supported = Boolean((this.wallet as { assetManager?: unknown }).assetManager);

    return supported
      ? { supported: true }
      : {
          supported: false,
          reason: TOKEN_UNSUPPORTED_REASON,
        };
  }

  private getAssetManager() {
    const assetManager = (this.wallet as { assetManager?: any }).assetManager;
    if (!assetManager) {
      throw new Error(TOKEN_UNSUPPORTED_REASON);
    }

    return assetManager;
  }

  async issue(params: TokenIssueParams): Promise<TokenInfo> {
    const assetManager = this.getAssetManager();

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
    const assetManager = this.getAssetManager();

    return assetManager.transfer({
      address: params.address,
      assetId: params.assetId,
      amount: params.amount,
    });
  }

  async getBalances(): Promise<TokenBalance[]> {
    const assetManager = this.getAssetManager();

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
