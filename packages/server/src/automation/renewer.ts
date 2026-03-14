import type { Wallet } from "@arkade-os/sdk";

/**
 * VTXORenewer monitors VTXOs approaching expiry and renews them
 * by performing a self-send, creating fresh VTXOs with new expiry.
 *
 * VTXOs are tied to batch output lifetimes. If they expire, the user
 * loses unilateral exit rights. The renewer prevents this automatically.
 */
export class VTXORenewer {
  private wallet: Wallet;
  private thresholdSecs: number;

  constructor(wallet: Wallet, thresholdSecs: number) {
    this.wallet = wallet;
    this.thresholdSecs = thresholdSecs;
  }

  /**
   * Check for expiring VTXOs and renew them via self-send.
   * Called periodically by the scheduler.
   */
  async tick(): Promise<void> {
    try {
      const vtxos = await this.wallet.getVtxos();
      const now = Math.floor(Date.now() / 1000);
      const threshold = now + this.thresholdSecs;

      // Find VTXOs that are close to expiring
      const expiring = vtxos.filter((vtxo: any) => {
        const expiresAt = vtxo.expireAt || vtxo.expiresAt;
        return (
          expiresAt &&
          expiresAt < threshold &&
          vtxo.status !== "spent" &&
          vtxo.amount > 0
        );
      });

      if (expiring.length === 0) return;

      const totalAmount = expiring.reduce(
        (sum: number, v: any) => sum + v.amount,
        0
      );

      console.log(
        `[VTXORenewer] Found ${expiring.length} VTXO(s) expiring soon ` +
        `(${totalAmount} sats). Renewing via self-send...`
      );

      // Self-send to refresh VTXOs into a new batch with fresh expiry
      const ownAddress = await this.wallet.getAddress();
      const txid = await this.wallet.sendBitcoin({
        address: ownAddress,
        amount: totalAmount,
      });

      console.log(`[VTXORenewer] Renewed successfully. Txid: ${txid}`);
    } catch (err: any) {
      console.error("[VTXORenewer] Error:", err.message);
    }
  }
}
