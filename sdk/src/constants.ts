import { PublicKey } from "@solana/web3.js";
import assetraIdl from "./idl/assetra.json";
import deskIdl from "./idl/demo_desk.json";

export const ASSETRA_PROGRAM_ID = new PublicKey(assetraIdl.address);
export const DESK_PROGRAM_ID = new PublicKey(deskIdl.address);

export const SEEDS = {
  index: "index",
  indexMint: "index_mint",
  plan: "plan",
  desk: "desk",
  feed: "feed",
  faucet: "faucet",
} as const;

export const INDEX_DECIMALS = 9;
export const INDEX_UNIT = 1_000_000_000n;
export const USDC_DECIMALS = 6;
export const BPS = 10_000n;
/** Tessera T-Token transfer fee (Token-2022 extension), in bps. */
export const TESSERA_TRANSFER_FEE_BPS = 20n;
export const MIN_PLAN_INTERVAL = 60;
