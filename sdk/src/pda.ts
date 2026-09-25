import { Buffer } from "buffer";
import { PublicKey } from "@solana/web3.js";
import { ASSETRA_PROGRAM_ID, DESK_PROGRAM_ID, SEEDS } from "./constants";

const find = (seeds: (Buffer | Uint8Array)[], program: PublicKey) =>
  PublicKey.findProgramAddressSync(seeds, program)[0];

const u64le = (n: bigint | number) => {
  const b = new Uint8Array(8);
  new DataView(b.buffer).setBigUint64(0, BigInt(n), true);
  return b;
};

export const indexPda = (symbol: string) => find([Buffer.from(SEEDS.index), Buffer.from(symbol)], ASSETRA_PROGRAM_ID);
export const indexMintPda = (index: PublicKey) =>
  find([Buffer.from(SEEDS.indexMint), index.toBuffer()], ASSETRA_PROGRAM_ID);
export const planPda = (index: PublicKey, owner: PublicKey, id: bigint | number) =>
  find([Buffer.from(SEEDS.plan), index.toBuffer(), owner.toBuffer(), u64le(id)], ASSETRA_PROGRAM_ID);
export const deskPda = () => find([Buffer.from(SEEDS.desk)], DESK_PROGRAM_ID);
export const feedPda = (mint: PublicKey) => find([Buffer.from(SEEDS.feed), mint.toBuffer()], DESK_PROGRAM_ID);
export const faucetClaimPda = (user: PublicKey) =>
  find([Buffer.from(SEEDS.faucet), user.toBuffer()], DESK_PROGRAM_ID);
