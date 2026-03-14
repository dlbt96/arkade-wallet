export type PaymentRoute = "ark" | "lightning" | "onchain";

export interface SendRequest {
  destination: string;
  amountSats: number;
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
  /** Amount embedded in the invoice (sats), if applicable */
  invoiceAmountSats?: number;
}
