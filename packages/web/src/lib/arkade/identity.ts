import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";
import { hex } from "@scure/base";
import { SingleKey } from "@arkade-os/sdk";
import { BrowserWalletStore } from "./store";

export interface IdentityResult {
  identity: SingleKey;
  mnemonic?: string;
  privateKeyHex?: string;
}

function mnemonicToPrivateKey(mnemonic: string): string {
  const seed = mnemonicToSeedSync(mnemonic);
  return hex.encode(seed.slice(0, 32));
}

export function loadOrCreateIdentity(store: BrowserWalletStore): IdentityResult {
  const state = store.getState();

  if (state?.mnemonic) {
    const privateKeyHex = mnemonicToPrivateKey(state.mnemonic);

    return {
      identity: SingleKey.fromHex(privateKeyHex),
      mnemonic: state.mnemonic,
      privateKeyHex,
    };
  }

  if (state?.privateKeyHex) {
    return {
      identity: SingleKey.fromHex(state.privateKeyHex),
      privateKeyHex: state.privateKeyHex,
    };
  }

  const mnemonic = generateMnemonic(wordlist, 128);
  const privateKeyHex = mnemonicToPrivateKey(mnemonic);

  return {
    identity: SingleKey.fromHex(privateKeyHex),
    mnemonic,
    privateKeyHex,
  };
}

export function importFromMnemonic(mnemonic: string): IdentityResult {
  const trimmed = mnemonic.trim().toLowerCase();

  if (!validateMnemonic(trimmed, wordlist)) {
    throw new Error("Invalid mnemonic phrase");
  }

  const privateKeyHex = mnemonicToPrivateKey(trimmed);

  return {
    identity: SingleKey.fromHex(privateKeyHex),
    mnemonic: trimmed,
    privateKeyHex,
  };
}
