# GitHub Pages Static Arkade PWA

This project can now be deployed as a static, self-custodial Arkade wallet. The wallet keys and Arkade state live in the browser instead of a custom backend.

## What changed

- The React app now talks directly to the Arkade SDK in the browser.
- Wallet identity is stored locally in the browser.
- Arkade SDK state is persisted with IndexedDB.
- The app includes a web manifest and service worker registration for PWA installation.
- GitHub Pages deployment no longer requires a custom API backend.

## Deploy to GitHub Pages

1. Push this folder to a GitHub repository.
2. In `Settings > Pages`, select `GitHub Actions` as the source.
3. Push to `main` or run the `Deploy Web to GitHub Pages` workflow manually.

The workflow publishes `packages/web/dist`.

## Optional GitHub repository variables

You only need these if you want to override the defaults:

- `VITE_ARKADE_NETWORK`
  - Default: `mutinynet`
  - Allowed values: `bitcoin`, `mutinynet`, `signet`, `regtest`
- `VITE_ARKADE_SERVER_URL`
  - Override the Arkade server URL
- `VITE_BOLTZ_API_URL`
  - Override the Boltz swap API URL
- `VITE_ESPLORA_URL`
  - Optional onchain explorer URL
- `VITE_PUBLIC_BASE_PATH`
  - Optional explicit GitHub Pages base path

## Local development

Use the web package directly:

```bash
pnpm install
pnpm --filter @arkade-wallet/web dev
```

## Important notes

- This wallet is self-custodial per browser profile. If you clear browser storage without backing up the recovery phrase, the wallet is gone.
- Onchain boarding auto-conversion and VTXO renewal happen while the app is open.
- If you want fully background processing when the app is closed, the next step would be moving wallet operations to Arkade's `ServiceWorkerWallet`.
