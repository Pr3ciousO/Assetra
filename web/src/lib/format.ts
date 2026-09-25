import { fromUi } from "@assetra/sdk";

const usdFmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const compactFmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 });
const numFmt = (d: number) => new Intl.NumberFormat("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

export const usd = (v: number) => usdFmt.format(Number.isFinite(v) ? v : 0);
export const usdCompact = (v: number) => compactFmt.format(v);
export const num = (v: number, d = 4) => numFmt(d).format(Number.isFinite(v) ? v : 0);
export const int = (v: number) => new Intl.NumberFormat("en-US").format(v);
export const pct = (v: number, d = 2) => `${v >= 0 ? "+" : ""}${v.toFixed(d)}%`;
export const shortAddr = (a: string, n = 4) => `${a.slice(0, n)}…${a.slice(-n)}`;

export function duration(secs: number): string {
  if (secs <= 0) return "now";
  const d = Math.floor(secs / 86400);
  const h = Math.floor((secs % 86400) / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${s}s`;
  return `${s}s`;
}

export function cadence(secs: number): string {
  if (secs % 604800 === 0) return secs === 604800 ? "Weekly" : `Every ${secs / 604800} weeks`;
  if (secs % 86400 === 0) return secs === 86400 ? "Daily" : secs === 2592000 ? "Monthly" : `Every ${secs / 86400} days`;
  if (secs % 3600 === 0) return secs === 3600 ? "Hourly" : `Every ${secs / 3600} hours`;
  return secs === 60 ? "Every minute" : `Every ${Math.round(secs / 60)} min`;
}

/** Parse a decimal input string into base units; 0 on anything invalid. */
export function parseAmount(v: string, decimals: number): bigint {
  try {
    return fromUi(v || "0", decimals);
  } catch {
    return 0n;
  }
}

/** Unique-per-wallet plan id (plan PDAs are seeded by owner + id). */
export const newPlanId = () => BigInt(Date.now());
