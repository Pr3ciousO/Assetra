import type { AccountInfo, ParsedAccountData } from "@solana/web3.js";

/** Raw token amount from a jsonParsed token account (0 if missing). */
export function parsedAmount(account: AccountInfo<Buffer | ParsedAccountData> | null): bigint {
  const data = account?.data;
  if (!data || !("parsed" in data)) return 0n;
  return BigInt((data.parsed as { info?: { tokenAmount?: { amount?: string } } }).info?.tokenAmount?.amount ?? 0);
}
