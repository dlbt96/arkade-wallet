import type { ArkadeLightning } from "@arkade-os/boltz-swap";
import type { SendResult } from "./types";

export async function sendViaLightning(
  lightning: ArkadeLightning,
  invoice: string
): Promise<SendResult> {
  const result = await lightning.sendLightningPayment({ invoice });

  return {
    txid: result.preimage,
    route: "lightning",
    amount: result.amount,
  };
}
