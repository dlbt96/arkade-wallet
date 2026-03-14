import type { Wallet } from "@arkade-os/sdk";
import { Ramps } from "@arkade-os/sdk";
import type { SendResult } from "./types.js";

/**
 * Send Bitcoin onchain by offboarding VTXOs.
 * Arkade VTXOs → onchain BTC at a bc1/tb1 address.
 */
export async function sendViaOnchain(
  wallet: Wallet,
  address: string,
  amountSats: number
): Promise<SendResult> {
  const ramps = new Ramps(wallet);
  const info = await wallet.arkProvider.getInfo();

  const exitTxid = await ramps.offboard(
    address,
    info.fees,
    BigInt(amountSats)
  );

  return {
    txid: exitTxid,
    route: "onchain",
    amount: amountSats,
  };
}
