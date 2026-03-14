import { Ramps, type Wallet } from "@arkade-os/sdk";
import type { SendResult } from "./types";

export async function sendViaOnchain(
  wallet: Wallet,
  address: string,
  amountSats: number
): Promise<SendResult> {
  const ramps = new Ramps(wallet);
  const info = await wallet.arkProvider.getInfo();
  const txid = await ramps.offboard(address, info.fees, BigInt(amountSats));

  return {
    txid,
    route: "onchain",
    amount: amountSats,
  };
}
