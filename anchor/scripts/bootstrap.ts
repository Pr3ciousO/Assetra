/**
 * One-shot deployment bootstrap (localnet or devnet):
 *   demo mints (Token-2022 + metadata, T-Tokens with Tessera's 20 bps transfer fee)
 *   → desk + price feeds (live Tessera prices) → FRNT index + components
 *   → sdk/src/deployments/<cluster>.json
 *
 *   CLUSTER=localnet|devnet RPC_URL=... SITE_URL=... pnpm --filter @assetra/anchor bootstrap
 */
import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import {
  AuthorityType,
  ExtensionType,
  LENGTH_SIZE,
  TOKEN_2022_PROGRAM_ID,
  TYPE_SIZE,
  createAssociatedTokenAccountIdempotentInstruction,
  createInitializeMetadataPointerInstruction,
  createInitializeMintInstruction,
  createInitializeTransferFeeConfigInstruction,
  createSetAuthorityInstruction,
  getAssociatedTokenAddressSync,
  getMintLen,
} from "@solana/spl-token";
import { createInitializeInstruction, pack } from "@solana/spl-token-metadata";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Assetra } from "../target/types/assetra";
import type { DemoDesk } from "../target/types/demo_desk";

const TOKEN = TOKEN_2022_PROGRAM_ID;
const ROOT = join(__dirname, "..", "..");
const CLUSTER = (process.env.CLUSTER ?? "devnet") as "devnet" | "localnet";
const RPC_URL = process.env.RPC_URL ?? (CLUSTER === "devnet" ? "https://api.devnet.solana.com" : "http://127.0.0.1:8899");
const SITE_URL = process.env.SITE_URL ?? "https://assetra.vercel.app";

const SYMBOL = "FRNT";
const INDEX_NAME = "Frontier Index";
const LAUNCH_NAV_MICRO = 100_000_000n; // $100
const MINT_FEE_BPS = 30;
const REDEEM_FEE_BPS = 30;
const KEEPER_TIP = 10_000n; // $0.01
const TRANSFER_FEE_BPS = 20;
const U64_MAX = (1n << 64n) - 1n;

const COMPONENTS = [
  { tesseraId: "T-OpenAI", weightBps: 4500 },
  { tesseraId: "T-SpaceX", weightBps: 4000 },
  { tesseraId: "T-Kalshi", weightBps: 1500 },
];

const loadKeypair = (p: string) => Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(p, "utf8"))));
const pda = (seeds: (Buffer | Uint8Array)[], program: PublicKey) => PublicKey.findProgramAddressSync(seeds, program)[0];
const ata = (mint: PublicKey, owner: PublicKey) => getAssociatedTokenAddressSync(mint, owner, true, TOKEN);

async function createDemoMint(
  conn: Connection,
  payer: Keypair,
  finalAuthority: PublicKey,
  opts: { decimals: number; name: string; symbol: string; uri: string; transferFeeBps?: number },
): Promise<PublicKey> {
  const mint = Keypair.generate();
  const exts = [ExtensionType.MetadataPointer];
  if (opts.transferFeeBps !== undefined) exts.push(ExtensionType.TransferFeeConfig);
  const space = getMintLen(exts);
  const metaLen =
    TYPE_SIZE +
    LENGTH_SIZE +
    pack({
      mint: mint.publicKey,
      name: opts.name,
      symbol: opts.symbol,
      uri: opts.uri,
      additionalMetadata: [],
      updateAuthority: payer.publicKey,
    }).length;
  const lamports = await conn.getMinimumBalanceForRentExemption(space + metaLen);

  const tx = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mint.publicKey,
      space,
      lamports,
      programId: TOKEN,
    }),
  );
  if (opts.transferFeeBps !== undefined) {
    tx.add(
      createInitializeTransferFeeConfigInstruction(mint.publicKey, payer.publicKey, payer.publicKey, opts.transferFeeBps, U64_MAX, TOKEN),
    );
  }
  tx.add(
    createInitializeMetadataPointerInstruction(mint.publicKey, payer.publicKey, mint.publicKey, TOKEN),
    createInitializeMintInstruction(mint.publicKey, opts.decimals, payer.publicKey, null, TOKEN),
    createInitializeInstruction({
      programId: TOKEN,
      metadata: mint.publicKey,
      updateAuthority: payer.publicKey,
      mint: mint.publicKey,
      mintAuthority: payer.publicKey,
      name: opts.name,
      symbol: opts.symbol,
      uri: opts.uri,
    }),
    // The desk PDA fills trades by minting, so it owns mint authority.
    createSetAuthorityInstruction(mint.publicKey, payer.publicKey, AuthorityType.MintTokens, finalAuthority, [], TOKEN),
  );
  await sendAndConfirmTransaction(conn, tx, [payer, mint], { commitment: "confirmed" });
  return mint.publicKey;
}

async function main() {
  const conn = new Connection(RPC_URL, "confirmed");
  const deployer = loadKeypair(join(ROOT, "wallets", "deployer.keypair.json"));
  const keeper = loadKeypair(join(ROOT, "wallets", "keeper.keypair.json"));
  const provider = new anchor.AnchorProvider(conn, new anchor.Wallet(deployer), {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  });
  const desk = new Program<DemoDesk>(require("../target/idl/demo_desk.json"), provider);
  const program = new Program<Assetra>(require("../target/idl/assetra.json"), provider);

  console.log(`cluster ${CLUSTER} · rpc ${RPC_URL}`);
  console.log(`deployer ${deployer.publicKey.toBase58()} · ${(await conn.getBalance(deployer.publicKey)) / LAMPORTS_PER_SOL} SOL`);

  const deskPda = pda([Buffer.from("desk")], desk.programId);
  if (await conn.getAccountInfo(deskPda)) {
    throw new Error(`Desk ${deskPda.toBase58()} already exists on ${CLUSTER}; this cluster is already bootstrapped.`);
  }

  // Live Tessera prices.
  const res = await fetch("https://rest-api.tessera.pe/v1/public/token-details");
  const tessera: { id: string; name: string; sector: string; mint: string; markPrice: number }[] = await res.json();
  const priced = COMPONENTS.map((c) => {
    const t = tessera.find((x) => x.id === c.tesseraId);
    if (!t) throw new Error(`Tessera token ${c.tesseraId} not found`);
    return { ...c, t, price: BigInt(Math.round(t.markPrice * 1_000_000)) };
  });

  console.log("→ creating demo mints");
  const usdcMint = await createDemoMint(conn, deployer, deskPda, {
    decimals: 6,
    name: "Demo USD Coin",
    symbol: "dUSDC",
    uri: `${SITE_URL}/tokens/dusdc.json`,
  });
  const mints: PublicKey[] = [];
  for (const c of priced) {
    mints.push(
      await createDemoMint(conn, deployer, deskPda, {
        decimals: 9,
        name: `${c.t.name} (Demo)`,
        symbol: c.t.id,
        uri: `${SITE_URL}/tokens/${c.t.id.toLowerCase()}.json`,
        transferFeeBps: TRANSFER_FEE_BPS,
      }),
    );
    console.log(`  ${c.t.id}: ${mints.at(-1)!.toBase58()} @ $${c.t.markPrice}`);
  }

  console.log("→ desk + feeds");
  await desk.methods
    .initDesk(keeper.publicKey, new BN(1800), new BN(5_000_000_000), new BN(3600))
    .accountsPartial({ admin: deployer.publicKey, desk: deskPda, usdcMint })
    .rpc();
  for (const [i, c] of priced.entries()) {
    await desk.methods
      .initFeed(new BN(c.price.toString()))
      .accountsPartial({ admin: deployer.publicKey, desk: deskPda, mint: mints[i], feed: pda([Buffer.from("feed"), mints[i].toBuffer()], desk.programId) })
      .rpc();
  }

  console.log("→ index");
  const index = pda([Buffer.from("index"), Buffer.from(SYMBOL)], program.programId);
  const indexMint = pda([Buffer.from("index_mint"), index.toBuffer()], program.programId);
  const treasury = ata(indexMint, deployer.publicKey);
  await program.methods
    .initIndex(SYMBOL, INDEX_NAME, `${SITE_URL}/tokens/frnt.json`, MINT_FEE_BPS, REDEEM_FEE_BPS, new BN(KEEPER_TIP.toString()))
    .accountsPartial({
      authority: deployer.publicKey,
      index,
      indexMint,
      treasuryOwner: deployer.publicKey,
      treasury,
      usdcMint,
      desk: deskPda,
      tokenProgram: TOKEN,
    })
    .rpc();

  const components = [];
  for (const [i, c] of priced.entries()) {
    const units = (LAUNCH_NAV_MICRO * BigInt(c.weightBps) * 10n ** 9n) / (10_000n * c.price);
    const vault = ata(mints[i], index);
    await program.methods
      .addComponent(new BN(units.toString()))
      .accountsPartial({ authority: deployer.publicKey, index, indexMint, componentMint: mints[i], vault, tokenProgram: TOKEN })
      .rpc();
    components.push({
      symbol: c.t.id,
      tesseraId: c.t.id,
      name: c.t.name,
      sector: c.t.sector,
      mint: mints[i].toBase58(),
      realMint: c.t.mint,
      vault: vault.toBase58(),
      feed: pda([Buffer.from("feed"), mints[i].toBuffer()], desk.programId).toBase58(),
      units: units.toString(),
      decimals: 9,
      weightBps: c.weightBps,
    });
    console.log(`  ${c.t.id}: ${units} units/FRNT`);
  }

  console.log("→ keeper wallet");
  const keeperTx = new Transaction().add(
    SystemProgram.transfer({ fromPubkey: deployer.publicKey, toPubkey: keeper.publicKey, lamports: 0.2 * LAMPORTS_PER_SOL }),
    createAssociatedTokenAccountIdempotentInstruction(deployer.publicKey, ata(usdcMint, keeper.publicKey), keeper.publicKey, usdcMint, TOKEN),
  );
  await sendAndConfirmTransaction(conn, keeperTx, [deployer], { commitment: "confirmed" });

  const deployment = {
    cluster: CLUSTER,
    // Committed file: never persist a keyed RPC URL; apps override via env.
    rpcUrl: CLUSTER === "devnet" ? "https://api.devnet.solana.com" : RPC_URL,
    assetraProgram: program.programId.toBase58(),
    deskProgram: desk.programId.toBase58(),
    desk: deskPda.toBase58(),
    usdcMint: usdcMint.toBase58(),
    indexSymbol: SYMBOL,
    indexName: INDEX_NAME,
    index: index.toBase58(),
    indexMint: indexMint.toBase58(),
    treasury: treasury.toBase58(),
    launchNavMicro: LAUNCH_NAV_MICRO.toString(),
    mintFeeBps: MINT_FEE_BPS,
    redeemFeeBps: REDEEM_FEE_BPS,
    components,
    createdAt: new Date().toISOString(),
  };
  const outDir = join(ROOT, "sdk", "src", "deployments");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, `${CLUSTER}.json`), JSON.stringify(deployment, null, 2) + "\n");
  console.log(`✓ wrote sdk/src/deployments/${CLUSTER}.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
