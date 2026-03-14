import { Router } from "express";
import type { WalletEngine } from "../wallet/engine.js";
import { validate, importWalletSchema } from "../middleware/validate.js";

export function walletRoutes(engine: WalletEngine): Router {
  const router = Router();

  /** GET /api/status - Check wallet status */
  router.get("/status", (_req, res) => {
    res.json({
      initialized: engine.isInitialized,
      hasWallet: engine.hasExistingWallet(),
    });
  });

  /** POST /api/wallet/create - Create a new wallet */
  router.post("/wallet/create", async (_req, res, next) => {
    try {
      if (engine.isInitialized) {
        res.status(400).json({ error: "Wallet already initialized" });
        return;
      }
      const result = await engine.initialize();
      res.json({
        success: true,
        isNew: result.isNew,
        mnemonic: result.mnemonic, // Only returned for new wallets — show once!
      });
    } catch (err) {
      next(err);
    }
  });

  /** POST /api/wallet/import - Import wallet from mnemonic */
  router.post("/wallet/import", validate(importWalletSchema), async (req, res, next) => {
    try {
      await engine.importWallet(req.body.mnemonic);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  /** GET /api/balance - Unified Bitcoin balance */
  router.get("/balance", async (_req, res, next) => {
    try {
      const balance = await engine.getBalance();
      res.json(balance);
    } catch (err) {
      next(err);
    }
  });

  /** GET /api/addresses - Receive addresses */
  router.get("/addresses", async (_req, res, next) => {
    try {
      const addresses = await engine.getAddresses();
      res.json(addresses);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
