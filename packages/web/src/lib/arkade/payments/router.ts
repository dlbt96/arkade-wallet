import type { Wallet } from "@arkade-os/sdk";
import type { ArkadeLightning } from "@arkade-os/boltz-swap";
import { detectDestination } from "./detector";
import { sendViaArk } from "./ark";
import { sendViaLightning } from "./lightning";
import { sendViaOnchain } from "./onchain";
import type { SendResult } from "./types";

export class PaymentRouter {
  private readonly wallet: Wallet;
  private readonly lightning: ArkadeLightning;
  private sendQueue: Promise<unknown> = Promise.resolve();

  constructor(wallet: Wallet, lightning: ArkadeLightning) {
    this.wallet = wallet;
    this.lightning = lightning;
  }

  async send(destination: string, amountSats: number): Promise<SendResult> {
    const result = new Promise<SendResult>((resolve, reject) => {
      this.sendQueue = this.sendQueue
        .then(() => this.executeSend(destination, amountSats))
        .then(resolve)
        .catch(reject);
    });

    return result;
  }

  preview(destination: string) {
    return detectDestination(destination);
  }

  private async executeSend(destination: string, amountSats: number): Promise<SendResult> {
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
}
