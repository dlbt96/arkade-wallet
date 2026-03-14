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
