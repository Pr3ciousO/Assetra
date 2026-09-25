import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";
import { Assetra } from "../target/types/assetra";
import { DemoDesk } from "../target/types/demo_desk";
import { airdrop, ata, balance, ceilDiv, createMint2022, ensureAta, expectError, pda } from "./helpers";

const TOKEN = TOKEN_2022_PROGRAM_ID;
const INDEX_UNIT = 1_000_000_000n;

describe("assetra", () => {
  const env = anchor.AnchorProvider.env();
  const provider = new anchor.AnchorProvider(env.connection, env.wallet, {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  });
  anchor.setProvider(provider);
  const conn = provider.connection;
  const admin = (provider.wallet as anchor.Wallet).payer;
  const desk = new Program<DemoDesk>(require("../target/idl/demo_desk.json"), provider);
  const program = new Program<Assetra>(require("../target/idl/assetra.json"), provider);

  const user = Keypair.generate();
  const keeper = Keypair.generate();
  const deskPda = pda([Buffer.from("desk")], desk.programId);
  const feedPda = (mint: PublicKey) => pda([Buffer.from("feed"), mint.toBuffer()], desk.programId);

  // Tessera mark prices (micro-USD per whole token) and fixed units per 1 FRNT.
  const comps = [
    { name: "T-OpenAI", price: 812_790_000n, units: 55_365_000n },
    { name: "T-SpaceX", price: 423_000_000n, units: 94_563_000n },
    { name: "T-Kalshi", price: 413_800_000n, units: 36_249_000n },
  ].map((c) => ({ ...c, mint: PublicKey.default, vault: PublicKey.default }));

  let usdc: PublicKey;
  const SYMBOL = "FRNT";
  const index = pda([Buffer.from("index"), Buffer.from(SYMBOL)], program.programId);
  const indexMint = pda([Buffer.from("index_mint"), index.toBuffer()], program.programId);
  const treasury = ata(indexMint, admin.publicKey);

  const buyRemaining = () =>
    comps.flatMap((c) => [
      { pubkey: c.mint, isSigner: false, isWritable: true },
      { pubkey: c.vault, isSigner: false, isWritable: true },
      { pubkey: feedPda(c.mint), isSigner: false, isWritable: false },
    ]);

  async function assertFullyBacked() {
    const supply = BigInt((await conn.getTokenSupply(indexMint, "confirmed")).value.amount);
    for (const c of comps) {
      const held = await balance(conn, c.vault);
      assert.isTrue(held >= ceilDiv(supply * c.units, INDEX_UNIT), `${c.name} under-backed`);
    }
  }

  before(async () => {
    await airdrop(conn, user.publicKey);
    await airdrop(conn, keeper.publicKey);
    usdc = await createMint2022(conn, admin, deskPda, 6);
    for (const c of comps) c.mint = await createMint2022(conn, admin, deskPda, 9, 20);
  });

  describe("demo_desk", () => {
    it("initializes the desk and price feeds", async () => {
      await desk.methods
        .initDesk(keeper.publicKey, new BN(3600), new BN(1_000_000_000), new BN(3600))
        .accountsPartial({ admin: admin.publicKey, desk: deskPda, usdcMint: usdc })
        .rpc();
      for (const c of comps) {
        await desk.methods
          .initFeed(new BN(c.price.toString()))
          .accountsPartial({ admin: admin.publicKey, desk: deskPda, mint: c.mint, feed: feedPda(c.mint) })
          .rpc();
      }
      const feed = await desk.account.priceFeed.fetch(feedPda(comps[0].mint));
      assert.equal(feed.price.toString(), comps[0].price.toString());
    });

    it("faucet mints 1,000 dUSDC once per cooldown", async () => {
      const faucet = () =>
        desk.methods
          .faucet()
          .accountsPartial({ user: user.publicKey, desk: deskPda, usdcMint: usdc, usdcTokenProgram: TOKEN })
          .signers([user])
          .rpc();
      await faucet();
      assert.equal(await balance(conn, ata(usdc, user.publicKey)), 1_000_000_000n);
      await expectError(faucet(), "FaucetCooldown");
    });

    it("only the price authority can post prices", async () => {
      const update = (signer: Keypair) =>
        desk.methods
          .updatePrice(new BN(comps[0].price.toString()))
          .accountsPartial({ priceAuthority: signer.publicKey, desk: deskPda, feed: feedPda(comps[0].mint) })
          .signers([signer])
          .rpc();
      await update(keeper);
      await expectError(update(user), "ConstraintHasOne");
    });

    it("buys and sells at mark price", async () => {
      const c = comps[0];
      const userT = (await ensureAta(conn, user, c.mint, user.publicKey));
      const userUsdc = ata(usdc, user.publicKey);
      await desk.methods
        .buy(new BN(100_000_000), new BN(0))
        .accountsPartial({
          buyer: user.publicKey, desk: deskPda, feed: feedPda(c.mint), tMint: c.mint, usdcMint: usdc,
          buyerUsdc: userUsdc, recipient: userT, tTokenProgram: TOKEN, usdcTokenProgram: TOKEN,
        })
        .signers([user])
        .rpc();
      const expected = (100_000_000n * 10n ** 9n) / c.price;
      assert.equal(await balance(conn, userT), expected);

      const half = expected / 2n;
      await desk.methods
        .sell(new BN(half.toString()), new BN(0))
        .accountsPartial({
          seller: user.publicKey, desk: deskPda, feed: feedPda(c.mint), tMint: c.mint, usdcMint: usdc,
          sellerT: userT, recipientUsdc: userUsdc, tTokenProgram: TOKEN, usdcTokenProgram: TOKEN,
        })
        .signers([user])
        .rpc();
      assert.equal(await balance(conn, userT), expected - half);
      assert.equal(await balance(conn, userUsdc), 900_000_000n + (half * c.price) / 10n ** 9n);
    });
  });

  describe("index", () => {
    it("creates FRNT with three components", async () => {
      await program.methods
        .initIndex(SYMBOL, "Frontier Index", "https://assetra.app/frnt.json", 30, 30, new BN(10_000))
        .accountsPartial({
          authority: admin.publicKey, index, indexMint, treasuryOwner: admin.publicKey, treasury,
          usdcMint: usdc, desk: deskPda, tokenProgram: TOKEN,
        })
        .rpc();
      for (const c of comps) {
        c.vault = ata(c.mint, index);
        await program.methods
          .addComponent(new BN(c.units.toString()))
          .accountsPartial({ authority: admin.publicKey, index, indexMint, componentMint: c.mint, vault: c.vault, tokenProgram: TOKEN })
          .rpc();
      }
      const acc = await program.account.index.fetch(index);
      assert.equal(acc.componentCount, 3);
      assert.equal(acc.symbol, SYMBOL);
    });

    it("buys FRNT with USDC, fully backed", async () => {
      const userUsdc = ata(usdc, user.publicKey);
      const before = await balance(conn, userUsdc);
      await program.methods
        .buyWithUsdc(new BN(250_000_000), new BN(1))
        .accountsPartial({
          user: user.publicKey, index, indexMint, userIndex: ata(indexMint, user.publicKey), treasury,
          usdcMint: usdc, userUsdc, desk: deskPda, deskProgram: desk.programId,
          tokenProgram: TOKEN, usdcTokenProgram: TOKEN,
        })
        .remainingAccounts(buyRemaining())
        .signers([user])
        .rpc();
      const spent = before - (await balance(conn, userUsdc));
      assert.isTrue(spent <= 250_000_000n && spent > 249_000_000n, `spent ${spent}`);
      const frnt = await balance(conn, ata(indexMint, user.publicKey));
      // NAV ≈ $100 → ~2.5 FRNT less the 0.30% fee
      assert.isTrue(frnt > 2_480_000_000n && frnt < 2_500_000_000n, `frnt ${frnt}`);
      assert.isTrue((await balance(conn, treasury)) > 0n);
      await assertFullyBacked();
    });

    it("locks composition once supply exists", async () => {
      const extra = await createMint2022(conn, admin, deskPda, 9, 20);
      await expectError(
        program.methods
          .addComponent(new BN(1))
          .accountsPartial({ authority: admin.publicKey, index, indexMint, componentMint: extra, vault: ata(extra, index), tokenProgram: TOKEN })
          .rpc(),
        "CompositionLocked",
      );
    });

    it("mints in kind, covering Tessera's transfer fee", async () => {
      // Get each component through the desk first.
      for (const c of comps) {
        const userT = await ensureAta(conn, user, c.mint, user.publicKey);
        await desk.methods
          .buy(new BN(60_000_000), new BN(0))
          .accountsPartial({
            buyer: user.publicKey, desk: deskPda, feed: feedPda(c.mint), tMint: c.mint, usdcMint: usdc,
            buyerUsdc: ata(usdc, user.publicKey), recipient: userT, tTokenProgram: TOKEN, usdcTokenProgram: TOKEN,
          })
          .signers([user])
          .rpc();
      }
      const amount = 500_000_000n; // 0.5 FRNT
      const vaultsBefore = await Promise.all(comps.map((c) => balance(conn, c.vault)));
      const frntBefore = await balance(conn, ata(indexMint, user.publicKey));
      await program.methods
        .mintInKind(new BN(amount.toString()))
        .accountsPartial({ user: user.publicKey, index, indexMint, userIndex: ata(indexMint, user.publicKey), treasury, tokenProgram: TOKEN })
        .remainingAccounts(
          comps.flatMap((c) => [
            { pubkey: c.mint, isSigner: false, isWritable: false },
            { pubkey: ata(c.mint, user.publicKey), isSigner: false, isWritable: true },
            { pubkey: c.vault, isSigner: false, isWritable: true },
          ]),
        )
        .signers([user])
        .rpc();
      for (const [i, c] of comps.entries()) {
        const delta = (await balance(conn, c.vault)) - vaultsBefore[i];
        assert.isTrue(delta >= ceilDiv(amount * c.units, INDEX_UNIT), `${c.name} delta ${delta}`);
      }
      const minted = (await balance(conn, ata(indexMint, user.publicKey))) - frntBefore;
      assert.equal(minted, amount - (amount * 30n) / 10_000n);
      await assertFullyBacked();
    });

    it("redeems in kind", async () => {
      const userIndex = ata(indexMint, user.publicKey);
      const amount = await balance(conn, userIndex);
      const tBefore = await Promise.all(comps.map((c) => balance(conn, ata(c.mint, user.publicKey))));
      await program.methods
        .redeemInKind(new BN(amount.toString()))
        .accountsPartial({ user: user.publicKey, index, indexMint, userIndex, treasury, tokenProgram: TOKEN })
        .remainingAccounts(
          comps.flatMap((c) => [
            { pubkey: c.mint, isSigner: false, isWritable: false },
            { pubkey: c.vault, isSigner: false, isWritable: true },
            { pubkey: ata(c.mint, user.publicKey), isSigner: false, isWritable: true },
          ]),
        )
        .signers([user])
        .rpc();
      assert.equal(await balance(conn, userIndex), 0n);
      const net = amount - (amount * 30n) / 10_000n;
      for (const [i, c] of comps.entries()) {
        const payout = (net * c.units) / INDEX_UNIT;
        const received = (await balance(conn, ata(c.mint, user.publicKey))) - tBefore[i];
        // User receives the payout less Tessera's 20 bps transfer fee.
        assert.equal(received, payout - ceilDiv(payout * 20n, 10_000n));
      }
      await assertFullyBacked();
    });
  });

  describe("auto-invest", () => {
    const planId = new BN(1);
    const plan = () =>
      pda([Buffer.from("plan"), index.toBuffer(), user.publicKey.toBuffer(), planId.toArrayLike(Buffer, "le", 8)], program.programId);
    const escrow = () => ata(usdc, plan());
    let keeperUsdc: PublicKey;

    const execute = () =>
      program.methods
        .executePlan()
        .accountsPartial({
          keeper: keeper.publicKey, plan: plan(), owner: user.publicKey, index, indexMint,
          ownerIndex: ata(indexMint, user.publicKey), treasury, usdcMint: usdc, escrow: escrow(),
          keeperUsdc, desk: deskPda, deskProgram: desk.programId, tokenProgram: TOKEN, usdcTokenProgram: TOKEN,
        })
        .remainingAccounts(buyRemaining())
        .signers([keeper])
        .rpc();

    before(async () => {
      keeperUsdc = await ensureAta(conn, keeper, usdc, keeper.publicKey);
    });

    it("creates a funded plan", async () => {
      await program.methods
        .createPlan(planId, new BN(25_000_000), new BN(60), 2, new BN(60_000_000))
        .accountsPartial({
          owner: user.publicKey, index, indexMint, plan: plan(), usdcMint: usdc, escrow: escrow(),
          ownerUsdc: ata(usdc, user.publicKey), ownerIndex: ata(indexMint, user.publicKey),
          tokenProgram: TOKEN, usdcTokenProgram: TOKEN,
        })
        .signers([user])
        .rpc();
      assert.equal(await balance(conn, escrow()), 60_000_000n);
    });

    it("anyone can execute a due run and earn the tip", async () => {
      await execute();
      const p = await program.account.plan.fetch(plan());
      assert.equal(p.runsDone, 1);
      assert.isTrue((await balance(conn, ata(indexMint, user.publicKey))) > 0n);
      assert.equal(await balance(conn, keeperUsdc), 10_000n);
      assert.isTrue((await balance(conn, escrow())) >= 60_000_000n - 25_010_000n);
      await assertFullyBacked();
    });

    it("rejects a run before it is due", async () => {
      await expectError(execute(), "PlanNotDue");
    });

    it("pauses and resumes", async () => {
      const set = (m: "pausePlan" | "resumePlan") =>
        program.methods[m]().accountsPartial({ owner: user.publicKey, plan: plan() }).signers([user]).rpc();
      await set("pausePlan");
      assert.deepEqual((await program.account.plan.fetch(plan())).status, { paused: {} });
      await set("resumePlan");
      assert.deepEqual((await program.account.plan.fetch(plan())).status, { active: {} });
    });

    it("cancels and refunds the escrow", async () => {
      const userUsdc = ata(usdc, user.publicKey);
      const before = await balance(conn, userUsdc);
      const left = await balance(conn, escrow());
      await program.methods
        .cancelPlan()
        .accountsPartial({ owner: user.publicKey, plan: plan(), usdcMint: usdc, escrow: escrow(), ownerUsdc: userUsdc, usdcTokenProgram: TOKEN })
        .signers([user])
        .rpc();
      assert.equal((await balance(conn, userUsdc)) - before, left);
      assert.isNull(await conn.getAccountInfo(plan()));
      assert.isNull(await conn.getAccountInfo(escrow()));
    });
  });
});
