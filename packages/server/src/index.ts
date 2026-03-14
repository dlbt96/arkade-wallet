import express from "express";
import cors from "cors";
import { loadConfig } from "./config.js";
import { WalletEngine } from "./wallet/engine.js";
import { walletRoutes } from "./routes/wallet.js";
import { sendRoutes } from "./routes/send.js";
import { receiveRoutes } from "./routes/receive.js";
import { transactionRoutes } from "./routes/transactions.js";
import { tokenRoutes } from "./routes/tokens.js";
import { errorHandler } from "./middleware/error.js";

async function main() {
  const config = loadConfig();
  const app = express();

  // Middleware
  app.use(
    cors({
      origin: createCorsOriginValidator(config.corsAllowedOrigins),
    })
  );
  app.use(express.json());

  // Create wallet engine
  const engine = new WalletEngine(config);

  // Mount API routes
  app.use("/api", walletRoutes(engine));
  app.use("/api", sendRoutes(engine));
  app.use("/api", receiveRoutes(engine));
  app.use("/api", transactionRoutes(engine));
  app.use("/api", tokenRoutes(engine));

  // Error handler (must be last)
  app.use(errorHandler);

  // Auto-initialize if wallet already exists
  if (engine.hasExistingWallet()) {
    console.log("[Server] Existing wallet found, initializing...");
    await engine.initialize();
  } else {
    console.log("[Server] No wallet found. Create one via POST /api/wallet/create");
  }

  // Start server
  app.listen(config.port, () => {
    console.log(`[Server] Arkade Wallet API running on http://localhost:${config.port}`);
    console.log(`[Server] Network: ${config.network}`);
    console.log(`[Server] CORS allowed origins: ${formatAllowedOrigins(config.corsAllowedOrigins)}`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log("\n[Server] Shutting down...");
    await engine.shutdown();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("[Server] Fatal error:", err);
  process.exit(1);
});

function createCorsOriginValidator(allowedOrigins: string[]) {
  const allowAll = allowedOrigins.includes("*");

  return (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowAll || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} is not allowed by CORS.`));
  };
}

function formatAllowedOrigins(allowedOrigins: string[]): string {
  return allowedOrigins.join(", ");
}
