import { Ramps, type Wallet } from "@arkade-os/sdk";

export class AutoOnboarder {
  private readonly wallet: Wallet;

  constructor(wallet: Wallet) {
    this.wallet = wallet;
  }

  async tick(): Promise<void> {
    try {
      const balance = await this.wallet.getBalance();
      const boardingTotal = balance.boarding?.total ?? 0;

      if (boardingTotal <= 0) return;

      const ramps = new Ramps(this.wallet);
      const info = await this.wallet.arkProvider.getInfo();
      const txid = await ramps.onboard(info.fees);

      console.log(`[AutoOnboarder] Onboarded ${boardingTotal} sats. Commitment: ${txid}`);
    } catch (err: any) {
      if (err.message?.includes("not confirmed") || err.message?.includes("no boarding")) {
        return;
      }

      console.error("[AutoOnboarder] Error:", err.message);
    }
  }
}
