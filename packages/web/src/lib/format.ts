/**
 * Format satoshis for display.
 * Shows as sats for small amounts, BTC for large.
 */
export function formatSats(sats: number): string {
  if (sats >= 100_000_000) {
    return `${(sats / 100_000_000).toFixed(8)} BTC`;
  }
  return `${sats.toLocaleString()} sats`;
}

/**
 * Format a large sat amount as BTC with appropriate decimal places.
 */
export function formatBtc(sats: number): string {
  return (sats / 100_000_000).toFixed(8);
}

/**
 * Truncate an address/string for display.
 */
export function truncate(str: string, start = 8, end = 6): string {
  if (str.length <= start + end + 3) return str;
  return `${str.slice(0, start)}...${str.slice(-end)}`;
}

/**
 * Format a timestamp for display.
 */
export function formatTime(timestamp: string | Date): string {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Get a human-readable label for a payment route.
 */
export function routeLabel(route: "ark" | "lightning" | "onchain"): string {
  switch (route) {
    case "ark":
      return "Instant";
    case "lightning":
      return "Lightning";
    case "onchain":
      return "Onchain";
  }
}

/**
 * Get the CSS class for a route badge.
 */
export function routeBadgeClass(route: "ark" | "lightning" | "onchain"): string {
  switch (route) {
    case "ark":
      return "badge-ark";
    case "lightning":
      return "badge-lightning";
    case "onchain":
      return "badge-onchain";
  }
}
