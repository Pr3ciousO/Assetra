/**
 * End-to-end run through the SDK against a bootstrapped cluster, with the keeper running:
 * faucet → buy FRNT with USDC → desk buys → mint in kind → redeem → Auto-Invest (keeper executes) → cancel.
 *   CLUSTER=localnet pnpm --filter @assetra/keeper e2e
 */
import "dotenv/config";
import { AssetraClient, getDeployment, previewBuy, toUi } from "@assetra/sdk";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  type TransactionInstruction,
} from "@solana/web3.js";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const cluster = process.env.CLUSTER ?? "localnet";
const d = getDeployment(cluster);
if (!d) throw new Error(`no deployment for ${cluster}`);
const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const deployer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(join(root, "wallets", "deployer.keypair.json"), "utf8"))));
const conn = new Connection(process.env.RPC_URL || d.rpcUrl, "confirmed");
const client = new AssetraClient(conn, d);
const user = Keypair.generate();
const explorer = (sig: string) =>
  `https://explorer.solana.com/tx/${sig}?cluster=${cluster === "devnet" ? "devnet" : "custom&customUrl=http%3A%2F%2F127.0.0.1%3A8899"}`;

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

async function send(label: string, ixs: TransactionInstruction[]) {
  const sig = await withRetry(() =>
    sendAndConfirmTransaction(conn, new Transaction().add(...ixs), [user], { commitment: "confirmed" }),
  );
  console.log(`✓ ${label.padEnd(26)} ${explorer(sig)}`);
}

async function wallet() {
  const w = await client.fetchWallet(user.publicKey);
  return `USDC ${toUi(w.usdc, 6).toFixed(2)} · FRNT ${toUi(w.index, 9).toFixed(6)} · ${w.components.map((c, i) => `${client.components[i].symbol} ${toUi(c, 9).toFixed(6)}`).join(" · ")}`;
}

async function main() {
  await sendAndConfirmTransaction(
    conn,
    new Transaction().add(SystemProgram.transfer({ fromPubkey: deployer.publicKey, toPubkey: user.publicKey, lamports: 0.1 * LAMPORTS_PER_SOL })),
    [deployer],
    { commitment: "confirmed" },
  );
  console.log(`user ${user.publicKey.toBase58()}`);

  await send("faucet", await client.faucetIx(user.publicKey));

  const feeds = await client.fetchFeeds();
  const priced = client.components.map((c, i) => ({ units: c.units, decimals: c.decimals, price: feeds[i].price }));
  const preview = previewBuy(250_000_000n, priced, d!.mintFeeBps)!;
  await send("buy $250 of FRNT", await client.buyWithUsdcIxs(user.publicKey, 250_000_000n, (preview.indexNet * 995n) / 1000n));
  const w1 = await client.fetchWallet(user.publicKey);
  if (w1.index !== preview.indexNet) throw new Error(`preview mismatch: ${w1.index} vs ${preview.indexNet}`);
  console.log(`  preview exact: ${toUi(preview.indexNet, 9)} FRNT for $${toUi(preview.spent, 6)}`);

  for (const i of client.components.keys()) await send(`desk buy ${client.components[i].symbol}`, await client.deskBuyIxs(user.publicKey, i, 30_000_000n));
  await send("mint 0.2 FRNT in kind", await client.mintInKindIxs(user.publicKey, 200_000_000n));
  await send("redeem 0.5 FRNT in kind", await client.redeemInKindIxs(user.publicKey, 500_000_000n));
  console.log(`  ${await wallet()}`);

  const id = BigInt(Date.now());
  const plan = client.planAddress(user.publicKey, id);
  await send("create Auto-Invest plan", await client.createPlanIxs(user.publicKey, { id, usdcPerRun: 20_000_000n, intervalSecs: 60, totalRuns: 3, deposit: 60_100_000n }));
  process.stdout.write("  waiting for keeper");
  for (let i = 0; i < 40; i++) {
    const [p] = await client.fetchPlans(user.publicKey);
    if (p?.runsDone >= 1) {
      console.log(`\n✓ keeper executed run 1: $${toUi(p.totalSpent, 6)} → ${toUi(p.totalIndexBought, 9)} FRNT`);
      break;
    }
    process.stdout.write(".");
    await new Promise((r) => setTimeout(r, 2000));
    if (i === 39) throw new Error("keeper did not execute the plan");
  }
  await send("cancel plan (refund)", await client.cancelPlanIxs(user.publicKey, plan));
  console.log(`  ${await wallet()}`);
  console.log("✓ e2e complete");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
