import * as anchor from "@coral-xyz/anchor";
import {
  ExtensionType,
  TOKEN_2022_PROGRAM_ID,
  createAssociatedTokenAccountIdempotent,
  createInitializeMintInstruction,
  createInitializeTransferFeeConfigInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
  getMintLen,
} from "@solana/spl-token";
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";

export const U64_MAX = (1n << 64n) - 1n;

export const pda = (seeds: (Buffer | Uint8Array)[], programId: PublicKey) =>
  PublicKey.findProgramAddressSync(seeds, programId)[0];

/** Token-2022 mint, optionally with a transfer-fee extension (bps). */
export async function createMint2022(
  conn: Connection,
  payer: Keypair,
  mintAuthority: PublicKey,
  decimals: number,
  feeBps?: number,
): Promise<PublicKey> {
  const mint = Keypair.generate();
  const exts = feeBps !== undefined ? [ExtensionType.TransferFeeConfig] : [];
  const space = getMintLen(exts);
  const lamports = await conn.getMinimumBalanceForRentExemption(space);
  const tx = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mint.publicKey,
      space,
      lamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
  );
  if (feeBps !== undefined) {
    tx.add(
      createInitializeTransferFeeConfigInstruction(
        mint.publicKey,
        payer.publicKey,
        payer.publicKey,
        feeBps,
        U64_MAX,
        TOKEN_2022_PROGRAM_ID,
      ),
    );
  }
  tx.add(createInitializeMintInstruction(mint.publicKey, decimals, mintAuthority, null, TOKEN_2022_PROGRAM_ID));
  await sendAndConfirmTransaction(conn, tx, [payer, mint], { commitment: "confirmed" });
  return mint.publicKey;
}

export const ata = (mint: PublicKey, owner: PublicKey) =>
  getAssociatedTokenAddressSync(mint, owner, true, TOKEN_2022_PROGRAM_ID);

export async function ensureAta(conn: Connection, payer: Keypair, mint: PublicKey, owner: PublicKey) {
  return createAssociatedTokenAccountIdempotent(conn, payer, mint, owner, { commitment: "confirmed" }, TOKEN_2022_PROGRAM_ID, undefined, true);
}

export async function balance(conn: Connection, account: PublicKey): Promise<bigint> {
  try {
    return (await getAccount(conn, account, "confirmed", TOKEN_2022_PROGRAM_ID)).amount;
  } catch {
    return 0n;
  }
}

export async function airdrop(conn: Connection, to: PublicKey, sol = 10) {
  const sig = await conn.requestAirdrop(to, sol * anchor.web3.LAMPORTS_PER_SOL);
  await conn.confirmTransaction(sig, "confirmed");
}

export const ceilDiv = (a: bigint, b: bigint) => (a + b - 1n) / b;

export async function expectError(p: Promise<unknown>, code: string) {
  try {
    await p;
  } catch (e: any) {
    const msg = `${e?.error?.errorCode?.code ?? ""} ${e?.message ?? ""} ${(e?.logs ?? []).join(" ")}`;
    if (msg.includes(code)) return;
    throw new Error(`expected ${code}, got: ${msg}`);
  }
  throw new Error(`expected ${code}, but call succeeded`);
}
