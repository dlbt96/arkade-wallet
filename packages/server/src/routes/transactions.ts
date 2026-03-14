import { Router } from "express";
import type { WalletEngine } from "../wallet/engine.js";

export function transactionRoutes(engine: WalletEngine): Router {
  const router = Router();

  /** GET /api/transactions - Unified transaction history */
  router.get("/transactions", async (_req, res, next) => {
    try {
      const transactions = await engine.getTransactions();
      res.json({ transactions });
    } catch (err) {
      next(err);
    }
  });

  /** GET /api/vtxos - Raw VTXO list (advanced) */
  router.get("/vtxos", async (_req, res, next) => {
    try {
      const vtxos = await engine.getVtxos();
      res.json({ vtxos });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
