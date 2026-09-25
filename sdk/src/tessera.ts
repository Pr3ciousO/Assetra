export const TESSERA_API = "https://rest-api.tessera.pe/v1/public/token-details";

export interface TesseraToken {
  id: string; // e.g. "T-OpenAI"
  name: string;
  symbol: string;
  code: string;
  sector: string;
  mint: string; // mainnet Token-2022 mint
  markPrice: number; // USD
  holders: number;
  markValuation: number; // USD
}

export async function fetchTesseraTokens(init?: RequestInit): Promise<TesseraToken[]> {
  const res = await fetch(TESSERA_API, { ...init, headers: { accept: "application/json", ...init?.headers } });
  if (!res.ok) throw new Error(`Tessera API ${res.status}`);
  return (await res.json()) as TesseraToken[];
}

/** USD → micro-USD (the desk's price unit). */
export const toMicroUsd = (usd: number) => BigInt(Math.round(usd * 1_000_000));
