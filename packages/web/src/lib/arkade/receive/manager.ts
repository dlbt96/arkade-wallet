import type { Wallet } from "@arkade-os/sdk";
import type { ArkadeLightning } from "@arkade-os/boltz-swap";
import type { LightningInvoiceResult, ReceiveAddresses } from "../types";

export class ReceiveManager {
  private readonly wallet: Wallet;
  private readonly lightning: ArkadeLightning;

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

  async createInvoice(
    amountSats: number,
    description?: string
  ): Promise<LightningInvoiceResult> {
    const result = await this.lightning.createLightningInvoice({
      amount: amountSats,
      ...(description ? { description } : {}),
    });

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
