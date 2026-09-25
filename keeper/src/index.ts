/**
 * Assetra keeper:
 *  - mirrors Tessera mark prices into the demo desk's price feeds
 *  - executes due Auto-Invest plans (earning the keeper tip)
 *  - records NAV snapshots for the web chart
 */
import "dotenv/config";
import {
  AssetraClient,
  fetchTesseraTokens,
  getDeployment,
  navMicro,
  toMicroUsd,
  type PricedComponent,
} from "@assetra/sdk";
import { Connection, Keypair, Transaction, sendAndConfirmTransaction, type TransactionInstruction } from "@solana/web3.js";
import { Redis } from "@upstash/redis";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PRICE_EVERY_MS = 60_000;
const PLANS_EVERY_MS = 15_000;
const NAV_EVERY_MS = 5 * 60_000;
/** Re-post an unchanged price before the desk's staleness window (30 min) closes. */
const PRICE_HEARTBEAT_S = 10 * 60;
const NAV_MAX_POINTS = 5_000;

const cluster = process.env.CLUSTER ?? "devnet";
const NAV_KEY = `assetra:nav:${cluster}`;
const deployment = getDeployment(cluster);
if (!deployment) throw new Error(`No deployment for ${cluster}. Run the bootstrap first.`);

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const keeper = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(process.env.KEEPER_KEYPAIR || readFileSync(join(root, "wallets", "keeper.keypair.json"), "utf8"))),
);
const connection = new Connection(process.env.RPC_URL || deployment.rpcUrl, "confirmed");
const client = new AssetraClient(connection, deployment);
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN ? Redis.fromEnv() : null;

const log = (...a: unknown[]) => console.log(new Date().toISOString(), ...a);

/** Retry transient RPC failures (lagging nodes, dropped blockhashes). */
async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (e) {
      const msg = (e as Error).message ?? "";
      if (i >= attempts || !/Blockhash not found|block height exceeded|fetch failed|429|timed out/i.test(msg)) throw e;
      await new Promise((r) => setTimeout(r, 1500 * i));
    }
  }
}

async function send(ixs: TransactionInstruction[]) {
  return withRetry(() =>
    sendAndConfirmTransaction(connection, new Transaction().add(...ixs), [keeper], { commitment: "confirmed" }),
  );
}

/** Latest Tessera prices (micro-USD), in component order. */
async function tesseraPrices(): Promise<bigint[]> {
  const tokens = await fetchTesseraTokens();
  return client.components.map((c) => {
    const t = tokens.find((x) => x.id === c.tesseraId);
    if (!t) throw new Error(`Tessera missing ${c.tesseraId}`);
    return toMicroUsd(t.markPrice);
  });
}

async function syncPrices() {
  const [prices, feeds] = await Promise.all([tesseraPrices(), client.fetchFeeds()]);
  const now = Math.floor(Date.now() / 1000);
  const ixs: TransactionInstruction[] = [];
  for (const [i, c] of client.components.entries()) {
    const stale = now - feeds[i].updatedAt > PRICE_HEARTBEAT_S;
    if (prices[i] !== feeds[i].price || stale) {
      ixs.push(await client.updatePriceIx(keeper.publicKey, c.mint, prices[i]));
    }
  }
  if (ixs.length) {
    const sig = await send(ixs);
    log(`prices posted (${ixs.length})`, sig);
  }
}

async function runDuePlans() {
  const now = Math.floor(Date.now() / 1000);
  const plans = await client.fetchAllPlans();
  const tip = BigInt((await client.fetchIndex()).keeperTip.toString());
  for (const { publicKey, account: p } of plans) {
    if (!("active" in p.status) || p.nextRunTs.toNumber() > now) continue;
    const escrow = await connection.getTokenAccountBalance(client.planAddressEscrow(publicKey)).catch(() => null);
    const funded = escrow && BigInt(escrow.value.amount) >= BigInt(p.usdcPerRun.toString()) + tip;
    if (!funded) continue;
    try {
      const sig = await send(await client.executePlanIxs(keeper.publicKey, publicKey, p.owner));
      log(`plan ${publicKey.toBase58().slice(0, 8)} run ${p.runsDone + 1}`, sig);
    } catch (e) {
      log(`plan ${publicKey.toBase58().slice(0, 8)} failed:`, (e as Error).message);
    }
  }
}

async function snapshotNav() {
  const prices = await tesseraPrices();
  const comps: PricedComponent[] = client.components.map((c, i) => ({ units: c.units, decimals: c.decimals, price: prices[i] }));
  const nav = Number(navMicro(comps)) / 1e6;
  const point = { t: Date.now(), nav, prices: prices.map((p) => Number(p) / 1e6) };
  if (redis) {
    await redis.rpush(NAV_KEY, JSON.stringify(point));
    await redis.ltrim(NAV_KEY, -NAV_MAX_POINTS, -1);
  }
  log(`nav $${nav.toFixed(4)}${redis ? "" : " (no redis: not stored)"}`);
}

function every(ms: number, name: string, fn: () => Promise<void>) {
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      await fn();
    } catch (e) {
      log(`${name} error:`, (e as Error).message);
    } finally {
      running = false;
    }
  };
  void tick();
  setInterval(tick, ms);
}

log(`keeper ${keeper.publicKey.toBase58()} on ${cluster}`);
every(PRICE_EVERY_MS, "prices", syncPrices);
every(PLANS_EVERY_MS, "plans", runDuePlans);
every(NAV_EVERY_MS, "nav", snapshotNav);
