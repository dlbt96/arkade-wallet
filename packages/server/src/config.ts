import "dotenv/config";

export interface AppConfig {
  port: number;
  arkServerUrl: string;
  boltzApiUrl: string;
  network: "bitcoin" | "mutinynet" | "signet" | "regtest";
  dataDir: string;
  corsAllowedOrigins: string[];
  /** Polling interval for auto-onboarding (ms) */
  onboardIntervalMs: number;
  /** Polling interval for VTXO renewal (ms) */
  renewalIntervalMs: number;
  /** Renew VTXOs when they're within this many seconds of expiry */
  renewalThresholdSecs: number;
}

const NETWORK_CONFIGS = {
  bitcoin: {
    arkServerUrl: "https://arkade.computer",
    boltzApiUrl: "https://api.ark.boltz.exchange",
  },
  mutinynet: {
    arkServerUrl: "https://mutinynet.arkade.sh",
    boltzApiUrl: "https://api.boltz.mutinynet.arkade.sh",
  },
  signet: {
    arkServerUrl: "https://signet.arkade.sh",
    boltzApiUrl: "https://api.boltz.mutinynet.arkade.sh",
  },
  regtest: {
    arkServerUrl: "http://localhost:7070",
    boltzApiUrl: "http://localhost:9069",
  },
} as const;

export function loadConfig(): AppConfig {
  const network = (process.env.ARKADE_NETWORK || "mutinynet") as AppConfig["network"];
  const networkConfig = NETWORK_CONFIGS[network] ?? NETWORK_CONFIGS.mutinynet;

  return {
    port: parseInt(process.env.PORT || "3001", 10),
    arkServerUrl: process.env.ARKADE_SERVER_URL || networkConfig.arkServerUrl,
    boltzApiUrl: process.env.BOLTZ_API_URL || networkConfig.boltzApiUrl,
    network,
    dataDir: process.env.ARKADE_DATA_DIR || getDefaultDataDir(),
    corsAllowedOrigins: parseCorsAllowedOrigins(process.env.CORS_ALLOWED_ORIGINS),
    onboardIntervalMs: 60_000,
    renewalIntervalMs: 5 * 60_000,
    renewalThresholdSecs: 24 * 60 * 60, // 24 hours
  };
}

function getDefaultDataDir(): string {
  const home = process.env.HOME || process.env.USERPROFILE || ".";
  return `${home}/.arkade-wallet`;
}

function parseCorsAllowedOrigins(value?: string): string[] {
  if (!value?.trim()) {
    return ["http://localhost:5173"];
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}
