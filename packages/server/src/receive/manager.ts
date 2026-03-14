import type { Wallet } from "@arkade-os/sdk";
import type { ArkadeLightning } from "@arkade-os/boltz-swap";

export interface ReceiveAddresses {
  ark: string;
  boarding: string;
}

export interface LightningInvoiceResult {
  invoice: string;
  paymentHash: string;
  amount: number;
}

/**
 * ReceiveManager handles all ways to receive Bitcoin.
 *
 * - Ark address: instant offchain, no amount required
 * - Boarding address: onchain deposit, auto-onboarded in background
 * - Lightning invoice: requires amount, uses Boltz reverse swap
 */
export class ReceiveManager {
  private wallet: Wallet;
  private lightning: ArkadeLightning;

  constructor(wallet: Wallet, lightning: ArkadeLightning) {
    this.wallet = wallet;
    this.lightning = lightning;
  }

  async getAddresses(): Promise<ReceiveAddresses> {
    const [ark, boarding] = await Promise.all([
      this.wallet.getAddress(),
      this.wallet.getBoardingAddress(),
    ]);
    return { ark, boarding };
  }

  /**
   * Create a Lightning invoice for receiving a payment.
   * The reverse swap automatically claims funds into Arkade VTXOs.
   */
  async createInvoice(
    amountSats: number,
    description?: string
  ): Promise<LightningInvoiceResult> {
    const result = await this.lightning.createLightningInvoice({
      amount: amountSats,
      ...(description ? { description } : {}),
    });

    // Start claiming in the background — don't block the response.
    // waitAndClaim needs the pendingSwap from the create response.
    this.lightning.waitAndClaim(result.pendingSwap).catch((err: Error) => {
      console.error("[ReceiveManager] Failed to claim reverse swap:", err.message);
    });

    return {
      invoice: result.invoice,
      paymentHash: result.paymentHash,
      amount: amountSats,
    };
  }
}
