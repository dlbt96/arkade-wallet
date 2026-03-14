/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ARKADE_NETWORK?: string;
  readonly VITE_ARKADE_SERVER_URL?: string;
  readonly VITE_BOLTZ_API_URL?: string;
  readonly VITE_ESPLORA_URL?: string;
  readonly VITE_PUBLIC_BASE_PATH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
