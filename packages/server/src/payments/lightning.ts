import type { ArkadeLightning } from "@arkade-os/boltz-swap";
import type { SendResult } from "./types.js";

/**
 * Pay a Lightning invoice via Boltz submarine swap.
 * Arkade VTXOs → Boltz → Lightning Network
 */
export async function sendViaLightning(
  lightning: ArkadeLightning,
  invoice: string
): Promise<SendResult> {
  const result = await lightning.sendLightningPayment({ invoice });

  return {
    txid: result.preimage,
    route: "lightning",
    amount: result.amount,
    // Boltz fee is embedded in the amount difference, not returned separately
  };
}

/**
 * Create a Lightning invoice to receive payment.
 * Lightning Network → Boltz reverse swap → Arkade VTXOs
 */
export async function createLightningInvoice(
  lightning: ArkadeLightning,
  amountSats: number,
  description?: string
): Promise<{ invoice: string; paymentHash: string }> {
  const result = await lightning.createLightningInvoice({
    amount: amountSats,
    ...(description ? { description } : {}),
  });

  return {
    invoice: result.invoice,
    paymentHash: result.paymentHash,
  };
}
