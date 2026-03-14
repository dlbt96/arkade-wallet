import type { Wallet } from "@arkade-os/sdk";
import { Ramps } from "@arkade-os/sdk";

/**
 * AutoOnboarder watches for onchain deposits at the boarding address
 * and automatically converts them to Arkade VTXOs.
 *
 * This runs in the background so users don't have to manually onboard —
 * they just see their Bitcoin balance increase.
 */
export class AutoOnboarder {
  private wallet: Wallet;

  constructor(wallet: Wallet) {
    this.wallet = wallet;
  }

  /**
   * Check for boarding deposits and onboard them.
   * Called periodically by the scheduler.
   */
  async tick(): Promise<void> {
    try {
      const balance = await this.wallet.getBalance();
      const boardingTotal = balance.boarding?.total ?? 0;

      if (boardingTotal <= 0) return;

      console.log(`[AutoOnboarder] Found ${boardingTotal} sats in boarding, onboarding...`);

      const ramps = new Ramps(this.wallet);
      const info = await this.wallet.arkProvider.getInfo();
      const txid = await ramps.onboard(info.fees);

      console.log(`[AutoOnboarder] Onboarded successfully. Commitment: ${txid}`);
    } catch (err: any) {
      // Boarding deposits may not have enough confirmations yet — that's OK
      if (err.message?.includes("not confirmed") || err.message?.includes("no boarding")) {
        return;
      }
      console.error("[AutoOnboarder] Error:", err.message);
    }
  }
}
