import { Redis } from "@upstash/redis";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { CLUSTER, RPC_URL } from "@/lib/config";

const GRANT = 0.05 * LAMPORTS_PER_SOL;
/** Only top up wallets that genuinely can't pay fees. */
const THRESHOLD = 0.02 * LAMPORTS_PER_SOL;
const PER_IP_PER_DAY = 5;

/** Funds a wallet with a little devnet SOL so it can pay fees and rent. Devnet/localnet only. */
export async function POST(req: Request) {
  const secret = process.env.SPONSOR_SECRET_KEY;
  if (!secret) return Response.json({ error: "Sponsor not configured" }, { status: 503 });

  let owner: PublicKey;
  try {
    owner = new PublicKey(((await req.json()) as { address: string }).address);
  } catch {
    return Response.json({ error: "Invalid address" }, { status: 400 });
  }

  const connection = new Connection(RPC_URL, "confirmed");
  if ((await connection.getBalance(owner)) >= THRESHOLD) return Response.json({ funded: false, reason: "has-sol" });

  // Rate limit when a store is configured: one grant per wallet, a few per IP per day.
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const redis = Redis.fromEnv();
    const ip = (req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
    const walletKey = `assetra:sponsor:${CLUSTER}:wallet:${owner.toBase58()}`;
    const ipKey = `assetra:sponsor:${CLUSTER}:ip:${ip}`;
    if (!(await redis.set(walletKey, 1, { nx: true, ex: 86_400 }))) {
      return Response.json({ error: "This wallet was already funded today" }, { status: 429 });
    }
    const hits = await redis.incr(ipKey);
    if (hits === 1) await redis.expire(ipKey, 86_400);
    if (hits > PER_IP_PER_DAY) return Response.json({ error: "Too many requests today" }, { status: 429 });
  }

  const sponsor = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(secret)));
  const signature = await sendAndConfirmTransaction(
    connection,
    new Transaction().add(SystemProgram.transfer({ fromPubkey: sponsor.publicKey, toPubkey: owner, lamports: GRANT })),
    [sponsor],
    { commitment: "confirmed" },
  );
  return Response.json({ funded: true, signature });
}
