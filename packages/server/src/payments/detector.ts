import type { DetectedDestination } from "./types.js";

/**
 * Detect the type of a payment destination string.
 *
 * Routes:
 *   ark1... / tark1...     → Arkade offchain
 *   lnbc... / lntb...      → Lightning (Boltz submarine swap)
 *   bc1... / tb1... / bcrt1... → Onchain (offboard via Ramps)
 *   bitcoin:...            → BIP21 URI (parsed recursively)
 */
export function detectDestination(input: string): DetectedDestination {
  const trimmed = input.trim();

  // BIP21 URI — parse and recurse
  if (trimmed.toLowerCase().startsWith("bitcoin:")) {
    return parseBip21(trimmed);
  }

  // Lightning invoice (BOLT11)
  if (/^ln(bc|tb|bcrt)/i.test(trimmed)) {
    return {
      type: "lightning",
      invoice: trimmed,
      invoiceAmountSats: decodeBolt11Amount(trimmed),
    };
  }

  // Ark address
  if (/^(ark1|tark1)/i.test(trimmed)) {
    return { type: "ark", address: trimmed };
  }

  // Onchain Bitcoin address (bech32/bech32m)
  if (/^(bc1|tb1|bcrt1)/i.test(trimmed)) {
    return { type: "onchain", address: trimmed };
  }

  // Legacy addresses (1... or 3...)
  if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(trimmed)) {
    return { type: "onchain", address: trimmed };
  }

  throw new Error(`Unrecognized destination format: ${trimmed.slice(0, 20)}...`);
}

/**
 * Parse a BIP21 bitcoin: URI.
 * Format: bitcoin:<address>?amount=<btc>&lightning=<invoice>
 */
function parseBip21(uri: string): DetectedDestination {
  const withoutScheme = uri.replace(/^bitcoin:/i, "");
  const [addressPart, queryString] = withoutScheme.split("?", 2);

  // If there's a lightning parameter, prefer it
  if (queryString) {
    const params = new URLSearchParams(queryString);
    const lightning = params.get("lightning");
    if (lightning) {
      return detectDestination(lightning);
    }
  }

  // Fall back to the address
  if (addressPart) {
    return detectDestination(addressPart);
  }

  throw new Error("Invalid BIP21 URI: no address found");
}

/**
 * Rough decode of the amount from a BOLT11 invoice.
 * Amount is encoded after ln<prefix> as a number + multiplier.
 */
function decodeBolt11Amount(invoice: string): number | undefined {
  try {
    // Strip the ln prefix (lnbc, lntb, lnbcrt)
    const match = invoice.match(/^ln(?:bc|tb|bcrt)(\d+)([munp])?/i);
    if (!match || !match[1]) return undefined;

    const value = parseInt(match[1], 10);
    const multiplier = match[2]?.toLowerCase();

    // Convert to satoshis (base unit is BTC)
    const multipliers: Record<string, number> = {
      m: 100_000,     // milli-BTC = 100,000 sats
      u: 100,         // micro-BTC = 100 sats
      n: 0.1,         // nano-BTC = 0.1 sats
      p: 0.0001,      // pico-BTC = 0.0001 sats
    };

    if (multiplier && multipliers[multiplier]) {
      return Math.floor(value * multipliers[multiplier]);
    }

    // No multiplier means the value is in BTC
    return value * 100_000_000;
  } catch {
    return undefined;
  }
}
