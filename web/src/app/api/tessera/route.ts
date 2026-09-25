import { TESSERA_API, type TesseraToken } from "@assetra/sdk";

/** Cached proxy for Tessera's public token API (browser CORS + 60s cache). */
export async function GET() {
  try {
    const res = await fetch(TESSERA_API, { next: { revalidate: 60 }, headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`Tessera ${res.status}`);
    const tokens = (await res.json()) as TesseraToken[];
    return Response.json(tokens, { headers: { "cache-control": "public, s-maxage=60, stale-while-revalidate=300" } });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 502 });
  }
}
