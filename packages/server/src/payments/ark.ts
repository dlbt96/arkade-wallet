import type { Wallet } from "@arkade-os/sdk";
import type { SendResult } from "./types.js";

/**
 * Send Bitcoin via Arkade offchain (VTXO transfer).
 * Instant, near-zero fees.
 */
export async function sendViaArk(
  wallet: Wallet,
  address: string,
  amountSats: number
): Promise<SendResult> {
  const txid = await wallet.sendBitcoin({
    address,
    amount: amountSats,
  });

  return {
    txid,
    route: "ark",
    amount: amountSats,
    fee: 0,
  };
}
