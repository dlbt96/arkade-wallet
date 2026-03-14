import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";
import { hex } from "@scure/base";
import { SingleKey } from "@arkade-os/sdk";
import { WalletStore } from "./store.js";

export interface IdentityResult {
  identity: SingleKey;
  mnemonic?: string;
  privateKeyHex?: string;
}

/**
 * Derive a 32-byte private key from a BIP39 mnemonic.
 * Uses the first 32 bytes of the 64-byte seed (no passphrase).
 */
function mnemonicToPrivateKey(mnemonic: string): string {
  const seed = mnemonicToSeedSync(mnemonic);
  // Use first 32 bytes of the 64-byte seed as the private key
  return hex.encode(seed.slice(0, 32));
}

/**
 * Load an existing identity from the store, or create a new one.
 * Supports both mnemonic-based and raw private key identities.
 */
export function loadOrCreateIdentity(store: WalletStore): IdentityResult {
  const state = store.getState();

  // Existing wallet with mnemonic — derive key from it
  if (state?.mnemonic) {
    const privKeyHex = mnemonicToPrivateKey(state.mnemonic);
    return {
      identity: SingleKey.fromHex(privKeyHex),
      mnemonic: state.mnemonic,
      privateKeyHex: privKeyHex,
    };
  }

  // Existing wallet with raw private key
  if (state?.privateKeyHex) {
    return {
      identity: SingleKey.fromHex(state.privateKeyHex),
      privateKeyHex: state.privateKeyHex,
    };
  }

  // Generate a new mnemonic-based identity
  const mnemonic = generateMnemonic(wordlist, 128);
  const privKeyHex = mnemonicToPrivateKey(mnemonic);
  return {
    identity: SingleKey.fromHex(privKeyHex),
    mnemonic,
    privateKeyHex: privKeyHex,
  };
}

/**
 * Import a wallet from a mnemonic phrase
 */
export function importFromMnemonic(mnemonic: string): IdentityResult {
  const trimmed = mnemonic.trim().toLowerCase();
  if (!validateMnemonic(trimmed, wordlist)) {
    throw new Error("Invalid mnemonic phrase");
  }
  const privKeyHex = mnemonicToPrivateKey(trimmed);
  return {
    identity: SingleKey.fromHex(privKeyHex),
    mnemonic: trimmed,
    privateKeyHex: privKeyHex,
  };
}

/**
 * Import a wallet from a hex private key
 */
export function importFromPrivateKey(privateKeyHex: string): IdentityResult {
  const trimmed = privateKeyHex.trim();
  return {
    identity: SingleKey.fromHex(trimmed),
    privateKeyHex: trimmed,
  };
}
