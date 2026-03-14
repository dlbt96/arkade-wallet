import type { DetectedDestination } from "./types";

export function detectDestination(input: string): DetectedDestination {
  const trimmed = input.trim();

  if (trimmed.toLowerCase().startsWith("bitcoin:")) {
    return parseBip21(trimmed);
  }

  if (/^ln(bc|tb|bcrt)/i.test(trimmed)) {
    return {
      type: "lightning",
      invoice: trimmed,
      invoiceAmountSats: decodeBolt11Amount(trimmed),
    };
  }

  if (/^(ark1|tark1)/i.test(trimmed)) {
    return { type: "ark", address: trimmed };
  }

  if (/^(bc1|tb1|bcrt1)/i.test(trimmed)) {
    return { type: "onchain", address: trimmed };
  }

  if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(trimmed)) {
    return { type: "onchain", address: trimmed };
  }

  throw new Error(`Unrecognized destination format: ${trimmed.slice(0, 20)}...`);
}

function parseBip21(uri: string): DetectedDestination {
  const withoutScheme = uri.replace(/^bitcoin:/i, "");
  const [addressPart, queryString] = withoutScheme.split("?", 2);

  if (queryString) {
    const params = new URLSearchParams(queryString);
    const lightning = params.get("lightning");
    if (lightning) {
      return detectDestination(lightning);
    }
  }

  if (addressPart) {
    return detectDestination(addressPart);
  }

  throw new Error("Invalid BIP21 URI: no address found");
}

function decodeBolt11Amount(invoice: string): number | undefined {
  try {
    const match = invoice.match(/^ln(?:bc|tb|bcrt)(\d+)([munp])?/i);
    if (!match || !match[1]) return undefined;

    const value = parseInt(match[1], 10);
    const multiplier = match[2]?.toLowerCase();
    const multipliers: Record<string, number> = {
      m: 100_000,
      u: 100,
      n: 0.1,
      p: 0.0001,
    };

    if (multiplier && multipliers[multiplier]) {
      return Math.floor(value * multipliers[multiplier]);
    }

    return value * 100_000_000;
  } catch {
    return undefined;
  }
}
