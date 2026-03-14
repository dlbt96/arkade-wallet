import { Router } from "express";
import type { WalletEngine } from "../wallet/engine.js";
import { validate, sendSchema } from "../middleware/validate.js";

export function sendRoutes(engine: WalletEngine): Router {
  const router = Router();

  /** POST /api/send - Send Bitcoin to any destination */
  router.post("/send", validate(sendSchema), async (req, res, next) => {
    try {
      const { destination, amountSats } = req.body;
      const result = await engine.send(destination, amountSats);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  /** POST /api/send/preview - Preview send route without executing */
  router.post("/send/preview", async (req, res, next) => {
    try {
      const { destination } = req.body;
      if (!destination) {
        res.status(400).json({ error: "destination is required" });
        return;
      }
      const preview = engine.previewSend(destination);
      res.json(preview);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
