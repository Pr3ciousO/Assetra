import { Redis } from "@upstash/redis";
import { NAV_KEY } from "@/lib/config";

/** NAV snapshots recorded by the keeper (empty if no store is configured). */
export async function GET() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return Response.json([]);
  try {
    const raw = await Redis.fromEnv().lrange<string | { t: number; nav: number }>(NAV_KEY, 0, -1);
    const points = raw.map((p) => (typeof p === "string" ? JSON.parse(p) : p)).map(({ t, nav }) => ({ t, nav }));
    return Response.json(points, { headers: { "cache-control": "public, s-maxage=60" } });
  } catch {
    return Response.json([]);
  }
}
