import type { Wallet } from "@arkade-os/sdk";

export class VtxoRenewer {
  private readonly wallet: Wallet;
  private readonly thresholdSecs: number;

  constructor(wallet: Wallet, thresholdSecs: number) {
    this.wallet = wallet;
    this.thresholdSecs = thresholdSecs;
  }

  async tick(): Promise<void> {
    try {
      const vtxos = await this.wallet.getVtxos();
      const now = Math.floor(Date.now() / 1000);
      const threshold = now + this.thresholdSecs;

      const expiring = vtxos.filter((vtxo: any) => {
        const expiresAt = vtxo.expireAt || vtxo.expiresAt || vtxo.virtualStatus?.batchExpiry;
        return expiresAt && expiresAt < threshold && vtxo.status !== "spent" && vtxo.amount > 0;
      });

      if (expiring.length === 0) return;

      const totalAmount = expiring.reduce((sum: number, vtxo: any) => sum + vtxo.amount, 0);
      const ownAddress = await this.wallet.getAddress();
      const txid = await this.wallet.sendBitcoin({
        address: ownAddress,
        amount: totalAmount,
      });

      console.log(`[VtxoRenewer] Renewed ${expiring.length} VTXO(s). Txid: ${txid}`);
    } catch (err: any) {
      console.error("[VtxoRenewer] Error:", err.message);
    }
  }
}
