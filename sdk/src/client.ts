import { AnchorProvider, BN, Program, type Wallet } from "@coral-xyz/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  ComputeBudgetProgram,
  Connection,
  Keypair,
  PublicKey,
  type AccountMeta,
  type TransactionInstruction,
} from "@solana/web3.js";
import { type Deployment, type ResolvedComponent, resolveComponents } from "./deployment";
import type { Assetra } from "./idl/assetra";
import assetraIdl from "./idl/assetra.json";
import type { DemoDesk } from "./idl/demo_desk";
import deskIdl from "./idl/demo_desk.json";
import { feedPda, planPda } from "./pda";

const TOKEN = TOKEN_2022_PROGRAM_ID;
const bn = (v: bigint | number) => new BN(v.toString());

export const ata = (mint: PublicKey, owner: PublicKey) =>
  getAssociatedTokenAddressSync(mint, owner, true, TOKEN, ASSOCIATED_TOKEN_PROGRAM_ID);

/** Read-only wallet so programs can be built without a signer. */
const readonlyWallet = (): Wallet => {
  const kp = Keypair.generate();
  return {
    publicKey: kp.publicKey,
    payer: kp,
    signTransaction: async () => {
      throw new Error("read-only wallet");
    },
    signAllTransactions: async () => {
      throw new Error("read-only wallet");
    },
  } as unknown as Wallet;
};

export type PlanStatus = "active" | "paused" | "completed";

export interface PlanView {
  address: PublicKey;
  id: bigint;
  owner: PublicKey;
  usdcPerRun: bigint;
  intervalSecs: number;
  totalRuns: number;
  runsDone: number;
  nextRunTs: number;
  lastRunTs: number;
  createdAt: number;
  totalSpent: bigint;
  totalIndexBought: bigint;
  status: PlanStatus;
  escrow: PublicKey;
}

export class AssetraClient {
  readonly program: Program<Assetra>;
  readonly desk: Program<DemoDesk>;
  readonly components: ResolvedComponent[];
  readonly index: PublicKey;
  readonly indexMint: PublicKey;
  readonly usdcMint: PublicKey;
  readonly treasury: PublicKey;
  readonly deskAccount: PublicKey;

  constructor(
    readonly connection: Connection,
    readonly deployment: Deployment,
  ) {
    const provider = new AnchorProvider(connection, readonlyWallet(), { commitment: "confirmed" });
    this.program = new Program<Assetra>(assetraIdl as Assetra, provider);
    this.desk = new Program<DemoDesk>(deskIdl as DemoDesk, provider);
    this.components = resolveComponents(deployment);
    this.index = new PublicKey(deployment.index);
    this.indexMint = new PublicKey(deployment.indexMint);
    this.usdcMint = new PublicKey(deployment.usdcMint);
    this.treasury = new PublicKey(deployment.treasury);
    this.deskAccount = new PublicKey(deployment.desk);
  }

  // ───────────────────────── reads ─────────────────────────

  async fetchIndex() {
    return this.program.account.index.fetch(this.index);
  }

  /** Mark prices (micro-USD) per component, in index order. */
  async fetchFeeds() {
    const feeds = await this.desk.account.priceFeed.fetchMultiple(this.components.map((c) => c.feed));
    return feeds.map((f, i) => ({
      mint: this.components[i].mint,
      price: f ? BigInt(f.price.toString()) : 0n,
      updatedAt: f ? f.updatedAt.toNumber() : 0,
    }));
  }

  async fetchVaultBalances(): Promise<bigint[]> {
    const infos = await this.connection.getMultipleParsedAccounts(this.components.map((c) => c.vault));
    return infos.value.map((a) => BigInt((a?.data as any)?.parsed?.info?.tokenAmount?.amount ?? 0));
  }

  async fetchSupply(): Promise<bigint> {
    return BigInt((await this.connection.getTokenSupply(this.indexMint)).value.amount);
  }

  /** Token balances for a wallet: USDC, index token, and each component. */
  async fetchWallet(owner: PublicKey) {
    const keys = [ata(this.usdcMint, owner), ata(this.indexMint, owner), ...this.components.map((c) => ata(c.mint, owner))];
    const infos = await this.connection.getMultipleParsedAccounts(keys);
    const amt = (i: number) => BigInt((infos.value[i]?.data as any)?.parsed?.info?.tokenAmount?.amount ?? 0);
    return {
      usdc: amt(0),
      index: amt(1),
      components: this.components.map((_, i) => amt(i + 2)),
    };
  }

  async fetchPlans(owner: PublicKey): Promise<PlanView[]> {
    const all = await this.program.account.plan.all([{ memcmp: { offset: 8, bytes: owner.toBase58() } }]);
    return all
      .map(({ publicKey, account: p }) => ({
        address: publicKey,
        id: BigInt(p.id.toString()),
        owner: p.owner,
        usdcPerRun: BigInt(p.usdcPerRun.toString()),
        intervalSecs: p.intervalSecs.toNumber(),
        totalRuns: p.totalRuns,
        runsDone: p.runsDone,
        nextRunTs: p.nextRunTs.toNumber(),
        lastRunTs: p.lastRunTs.toNumber(),
        createdAt: p.createdAt.toNumber(),
        totalSpent: BigInt(p.totalSpent.toString()),
        totalIndexBought: BigInt(p.totalIndexBought.toString()),
        status: Object.keys(p.status)[0] as PlanStatus,
        escrow: ata(this.usdcMint, publicKey),
      }))
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  /** Every plan on the index (keeper). */
  async fetchAllPlans() {
    return this.program.account.plan.all([{ memcmp: { offset: 8 + 32, bytes: this.index.toBase58() } }]);
  }

  // ─────────────────────── instructions ───────────────────────

  private buyRemaining(): AccountMeta[] {
    return this.components.flatMap((c) => [
      { pubkey: c.mint, isSigner: false, isWritable: true },
      { pubkey: c.vault, isSigner: false, isWritable: true },
      { pubkey: c.feed, isSigner: false, isWritable: false },
    ]);
  }

  private computeLimit(units = 400_000) {
    return ComputeBudgetProgram.setComputeUnitLimit({ units });
  }

  async faucetIx(user: PublicKey): Promise<TransactionInstruction[]> {
    return [
      await this.desk.methods
        .faucet()
        .accountsPartial({ user, desk: this.deskAccount, usdcMint: this.usdcMint, usdcTokenProgram: TOKEN })
        .instruction(),
    ];
  }

  async buyWithUsdcIxs(user: PublicKey, usdcIn: bigint, minOut: bigint): Promise<TransactionInstruction[]> {
    const ix = await this.program.methods
      .buyWithUsdc(bn(usdcIn), bn(minOut))
      .accountsPartial({
        user,
        index: this.index,
        indexMint: this.indexMint,
        userIndex: ata(this.indexMint, user),
        treasury: this.treasury,
        usdcMint: this.usdcMint,
        userUsdc: ata(this.usdcMint, user),
        desk: this.deskAccount,
        deskProgram: this.desk.programId,
        tokenProgram: TOKEN,
        usdcTokenProgram: TOKEN,
      })
      .remainingAccounts(this.buyRemaining())
      .instruction();
    return [this.computeLimit(), ix];
  }

  async mintInKindIxs(user: PublicKey, amount: bigint): Promise<TransactionInstruction[]> {
    const ix = await this.program.methods
      .mintInKind(bn(amount))
      .accountsPartial({
        user,
        index: this.index,
        indexMint: this.indexMint,
        userIndex: ata(this.indexMint, user),
        treasury: this.treasury,
        tokenProgram: TOKEN,
      })
      .remainingAccounts(
        this.components.flatMap((c) => [
          { pubkey: c.mint, isSigner: false, isWritable: false },
          { pubkey: ata(c.mint, user), isSigner: false, isWritable: true },
          { pubkey: c.vault, isSigner: false, isWritable: true },
        ]),
      )
      .instruction();
    return [this.computeLimit(), ix];
  }

  async redeemInKindIxs(user: PublicKey, amount: bigint): Promise<TransactionInstruction[]> {
    const createAtas = this.components.map((c) =>
      createAssociatedTokenAccountIdempotentInstruction(user, ata(c.mint, user), user, c.mint, TOKEN),
    );
    const ix = await this.program.methods
      .redeemInKind(bn(amount))
      .accountsPartial({
        user,
        index: this.index,
        indexMint: this.indexMint,
        userIndex: ata(this.indexMint, user),
        treasury: this.treasury,
        tokenProgram: TOKEN,
      })
      .remainingAccounts(
        this.components.flatMap((c) => [
          { pubkey: c.mint, isSigner: false, isWritable: false },
          { pubkey: c.vault, isSigner: false, isWritable: true },
          { pubkey: ata(c.mint, user), isSigner: false, isWritable: true },
        ]),
      )
      .instruction();
    return [this.computeLimit(), ...createAtas, ix];
  }

  /** Buy one component directly from the desk (for in-kind minting). */
  async deskBuyIxs(user: PublicKey, componentIndex: number, usdcIn: bigint, minOut = 0n) {
    const c = this.components[componentIndex];
    return [
      createAssociatedTokenAccountIdempotentInstruction(user, ata(c.mint, user), user, c.mint, TOKEN),
      await this.desk.methods
        .buy(bn(usdcIn), bn(minOut))
        .accountsPartial({
          buyer: user,
          desk: this.deskAccount,
          feed: feedPda(c.mint),
          tMint: c.mint,
          usdcMint: this.usdcMint,
          buyerUsdc: ata(this.usdcMint, user),
          recipient: ata(c.mint, user),
          tTokenProgram: TOKEN,
          usdcTokenProgram: TOKEN,
        })
        .instruction(),
    ];
  }

  async deskSellIxs(user: PublicKey, componentIndex: number, amountIn: bigint, minUsdcOut = 0n) {
    const c = this.components[componentIndex];
    return [
      createAssociatedTokenAccountIdempotentInstruction(user, ata(this.usdcMint, user), user, this.usdcMint, TOKEN),
      await this.desk.methods
        .sell(bn(amountIn), bn(minUsdcOut))
        .accountsPartial({
          seller: user,
          desk: this.deskAccount,
          feed: feedPda(c.mint),
          tMint: c.mint,
          usdcMint: this.usdcMint,
          sellerT: ata(c.mint, user),
          recipientUsdc: ata(this.usdcMint, user),
          tTokenProgram: TOKEN,
          usdcTokenProgram: TOKEN,
        })
        .instruction(),
    ];
  }

  planAddressEscrow(plan: PublicKey) {
    return ata(this.usdcMint, plan);
  }

  planAddress(owner: PublicKey, id: bigint) {
    return planPda(this.index, owner, id);
  }

  async createPlanIxs(
    owner: PublicKey,
    p: { id: bigint; usdcPerRun: bigint; intervalSecs: number; totalRuns: number; deposit: bigint },
  ): Promise<TransactionInstruction[]> {
    const plan = this.planAddress(owner, p.id);
    return [
      await this.program.methods
        .createPlan(bn(p.id), bn(p.usdcPerRun), bn(p.intervalSecs), p.totalRuns, bn(p.deposit))
        .accountsPartial({
          owner,
          index: this.index,
          indexMint: this.indexMint,
          plan,
          usdcMint: this.usdcMint,
          escrow: ata(this.usdcMint, plan),
          ownerUsdc: ata(this.usdcMint, owner),
          ownerIndex: ata(this.indexMint, owner),
          tokenProgram: TOKEN,
          usdcTokenProgram: TOKEN,
        })
        .instruction(),
    ];
  }

  async topUpPlanIxs(owner: PublicKey, plan: PublicKey, amount: bigint) {
    return [
      await this.program.methods
        .topUpPlan(bn(amount))
        .accountsPartial({
          owner,
          plan,
          usdcMint: this.usdcMint,
          escrow: ata(this.usdcMint, plan),
          ownerUsdc: ata(this.usdcMint, owner),
          usdcTokenProgram: TOKEN,
        })
        .instruction(),
    ];
  }

  async setPlanPausedIxs(owner: PublicKey, plan: PublicKey, paused: boolean) {
    const m = paused ? this.program.methods.pausePlan() : this.program.methods.resumePlan();
    return [await m.accountsPartial({ owner, plan }).instruction()];
  }

  async cancelPlanIxs(owner: PublicKey, plan: PublicKey) {
    return [
      await this.program.methods
        .cancelPlan()
        .accountsPartial({
          owner,
          plan,
          usdcMint: this.usdcMint,
          escrow: ata(this.usdcMint, plan),
          ownerUsdc: ata(this.usdcMint, owner),
          usdcTokenProgram: TOKEN,
        })
        .instruction(),
    ];
  }

  async executePlanIxs(keeper: PublicKey, plan: PublicKey, owner: PublicKey) {
    const ix = await this.program.methods
      .executePlan()
      .accountsPartial({
        keeper,
        plan,
        owner,
        index: this.index,
        indexMint: this.indexMint,
        ownerIndex: ata(this.indexMint, owner),
        treasury: this.treasury,
        usdcMint: this.usdcMint,
        escrow: ata(this.usdcMint, plan),
        keeperUsdc: ata(this.usdcMint, keeper),
        desk: this.deskAccount,
        deskProgram: this.desk.programId,
        tokenProgram: TOKEN,
        usdcTokenProgram: TOKEN,
      })
      .remainingAccounts(this.buyRemaining())
      .instruction();
    return [this.computeLimit(), ix];
  }

  async updatePriceIx(priceAuthority: PublicKey, mint: PublicKey, price: bigint) {
    return this.desk.methods
      .updatePrice(bn(price))
      .accountsPartial({ priceAuthority, desk: this.deskAccount, feed: feedPda(mint) })
      .instruction();
  }
}
