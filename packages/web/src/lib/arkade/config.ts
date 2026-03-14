import type { ArkadeNetwork } from "./types";

export interface ArkadeAppConfig {
  network: ArkadeNetwork;
  arkServerUrl: string;
  boltzApiUrl: string;
  esploraUrl?: string;
  walletStorageKey: string;
  walletDbName: string;
  onboardIntervalMs: number;
  renewalIntervalMs: number;
  renewalThresholdSecs: number;
}

const NETWORK_CONFIGS: Record<
  ArkadeNetwork,
  { arkServerUrl: string; boltzApiUrl: string; esploraUrl?: string }
> = {
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
    esploraUrl: "http://localhost:3000",
  },
};

function parseNetwork(value?: string): ArkadeNetwork {
  const candidate = value?.trim() as ArkadeNetwork | undefined;

  if (
    candidate === "bitcoin" ||
    candidate === "mutinynet" ||
    candidate === "signet" ||
    candidate === "regtest"
  ) {
    return candidate;
  }

  return "mutinynet";
}

export function loadConfig(): ArkadeAppConfig {
  const network = parseNetwork(import.meta.env.VITE_ARKADE_NETWORK);
  const defaults = NETWORK_CONFIGS[network];

  return {
    network,
    arkServerUrl: import.meta.env.VITE_ARKADE_SERVER_URL || defaults.arkServerUrl,
    boltzApiUrl: import.meta.env.VITE_BOLTZ_API_URL || defaults.boltzApiUrl,
    esploraUrl: import.meta.env.VITE_ESPLORA_URL || defaults.esploraUrl,
    walletStorageKey: `arkade-wallet/browser-state/${network}/v1`,
    walletDbName: `arkade-wallet-sdk-${network}`,
    onboardIntervalMs: 60_000,
    renewalIntervalMs: 5 * 60_000,
    renewalThresholdSecs: 24 * 60 * 60,
  };
}
