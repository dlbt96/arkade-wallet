import type { Wallet } from "@arkade-os/sdk";
import type { SendResult } from "./types";

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
