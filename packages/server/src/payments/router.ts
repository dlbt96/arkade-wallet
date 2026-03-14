import type { Wallet } from "@arkade-os/sdk";
import type { ArkadeLightning } from "@arkade-os/boltz-swap";
import { detectDestination } from "./detector.js";
import { sendViaArk } from "./ark.js";
import { sendViaLightning } from "./lightning.js";
import { sendViaOnchain } from "./onchain.js";
import type { SendResult } from "./types.js";

/**
 * PaymentRouter: the core of the unified UX.
 *
 * Accepts any destination string (ark address, Lightning invoice, onchain address,
 * BIP21 URI) and routes the payment through the correct backend.
 *
 * Serializes send operations to prevent concurrent VTXO spending conflicts.
 */
export class PaymentRouter {
  private wallet: Wallet;
  private lightning: ArkadeLightning;
  private sendQueue: Promise<unknown> = Promise.resolve();

  constructor(wallet: Wallet, lightning: ArkadeLightning) {
    this.wallet = wallet;
    this.lightning = lightning;
  }

  /**
   * Send Bitcoin to any destination. The router detects the type
   * and dispatches to the correct payment handler.
   */
  async send(destination: string, amountSats: number): Promise<SendResult> {
    // Serialize sends to avoid concurrent VTXO conflicts
    const result = new Promise<SendResult>((resolve, reject) => {
      this.sendQueue = this.sendQueue
        .then(() => this.executeSend(destination, amountSats))
        .then(resolve)
        .catch(reject);
    });
    return result;
  }

  private async executeSend(
    destination: string,
    amountSats: number
  ): Promise<SendResult> {
    const detected = detectDestination(destination);

    switch (detected.type) {
      case "ark":
        return sendViaArk(this.wallet, detected.address!, amountSats);

      case "lightning":
        return sendViaLightning(this.lightning, detected.invoice!);

      case "onchain":
        return sendViaOnchain(this.wallet, detected.address!, amountSats);

      default:
        throw new Error(`Unknown payment route: ${detected.type}`);
    }
  }

  /**
   * Preview what route a destination would use, without sending.
   */
  preview(destination: string) {
    return detectDestination(destination);
  }
}
