import type { Wallet } from "@arkade-os/sdk";
import { EventEmitter } from "node:events";

export interface IncomingFundsEvent {
  type: "vtxo" | "utxo";
  amount: number;
  ids: string[];
  timestamp: Date;
}

/**
 * FundMonitor listens for incoming Arkade funds and emits events.
 * Used for real-time notifications and UI updates.
 */
export class FundMonitor extends EventEmitter {
  private wallet: Wallet;
  private stopFn: (() => void) | null = null;

  constructor(wallet: Wallet) {
    super();
    this.wallet = wallet;
  }

  async start(): Promise<void> {
    if (this.stopFn) return;

    this.stopFn = await this.wallet.notifyIncomingFunds(async (notification: any) => {
      if (notification.type === "vtxo" && notification.vtxos) {
        const totalAmount = notification.vtxos.reduce(
          (sum: number, vtxo: any) => sum + vtxo.amount,
          0
        );
        const ids = notification.vtxos.map((v: any) => v.txid);

        const event: IncomingFundsEvent = {
          type: "vtxo",
          amount: totalAmount,
          ids,
          timestamp: new Date(),
        };

        console.log(`[FundMonitor] Received ${totalAmount} sats via ${ids.length} VTXO(s)`);
        this.emit("funds", event);
      }
    });

    console.log("[FundMonitor] Listening for incoming funds...");
  }

  stop(): void {
    if (this.stopFn) {
      this.stopFn();
      this.stopFn = null;
      console.log("[FundMonitor] Stopped listening.");
    }
  }
}
