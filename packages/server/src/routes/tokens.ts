import { Router } from "express";
import type { WalletEngine } from "../wallet/engine.js";
import { validate, tokenIssueSchema, tokenTransferSchema } from "../middleware/validate.js";

export function tokenRoutes(engine: WalletEngine): Router {
  const router = Router();

  /** POST /api/tokens/issue - Issue a new token */
  router.post("/tokens/issue", validate(tokenIssueSchema), async (req, res, next) => {
    try {
      const result = await engine.issueToken(req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  /** POST /api/tokens/transfer - Transfer tokens */
  router.post("/tokens/transfer", validate(tokenTransferSchema), async (req, res, next) => {
    try {
      const txid = await engine.transferToken(req.body);
      res.json({ txid });
    } catch (err) {
      next(err);
    }
  });

  /** GET /api/tokens/balances - Get all token balances */
  router.get("/tokens/balances", async (_req, res, next) => {
    try {
      const balances = await engine.getTokenBalances();
      res.json({ balances });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
