import { PublicKey } from "@solana/web3.js";

/** Addresses written by `anchor/scripts/bootstrap.ts` into `deployments/<cluster>.json`. */
export interface DeploymentComponent {
  symbol: string; // "T-OpenAI"
  tesseraId: string; // Tessera API id
  name: string;
  sector: string;
  mint: string; // demo mint (devnet)
  realMint: string; // Tessera mainnet mint
  vault: string;
  feed: string;
  units: string; // bigint as string
  decimals: number;
  weightBps: number; // launch weight
}

export interface Deployment {
  cluster: "devnet" | "localnet";
  rpcUrl: string;
  assetraProgram: string;
  deskProgram: string;
  desk: string;
  usdcMint: string;
  indexSymbol: string;
  indexName: string;
  index: string;
  indexMint: string;
  treasury: string;
  launchNavMicro: string;
  mintFeeBps: number;
  redeemFeeBps: number;
  components: DeploymentComponent[];
  createdAt: string;
}

export interface ResolvedComponent extends Omit<DeploymentComponent, "mint" | "realMint" | "vault" | "feed" | "units"> {
  mint: PublicKey;
  realMint: PublicKey;
  vault: PublicKey;
  feed: PublicKey;
  units: bigint;
}

export function resolveComponents(d: Deployment): ResolvedComponent[] {
  return d.components.map((c) => ({
    ...c,
    mint: new PublicKey(c.mint),
    realMint: new PublicKey(c.realMint),
    vault: new PublicKey(c.vault),
    feed: new PublicKey(c.feed),
    units: BigInt(c.units),
  }));
}
