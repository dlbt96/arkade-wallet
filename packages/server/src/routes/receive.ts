import { Router } from "express";
import type { WalletEngine } from "../wallet/engine.js";
import { validate, invoiceSchema } from "../middleware/validate.js";

export function receiveRoutes(engine: WalletEngine): Router {
  const router = Router();

  /** POST /api/receive/invoice - Create a Lightning invoice */
  router.post("/receive/invoice", validate(invoiceSchema), async (req, res, next) => {
    try {
      const { amountSats, description } = req.body;
      const result = await engine.createInvoice(amountSats, description);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  /** GET /api/receive/addresses - Get all receive addresses */
  router.get("/receive/addresses", async (_req, res, next) => {
    try {
      const addresses = await engine.getAddresses();
      res.json({
        instant: {
          address: addresses.ark,
          label: "Instant (Arkade)",
          description: "Receive Bitcoin instantly, no confirmations needed",
        },
        onchain: {
          address: addresses.boarding,
          label: "Onchain",
          description: "Standard Bitcoin transaction, auto-converted after confirmation",
        },
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
