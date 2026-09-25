import { getDeployment } from "@assetra/sdk";

export const CLUSTER = process.env.NEXT_PUBLIC_CLUSTER ?? "devnet";
export const deployment = getDeployment(CLUSTER);
/** The RPC override only applies to devnet; localnet always uses the local validator. */
export const RPC_URL =
  (CLUSTER === "localnet" ? deployment?.rpcUrl : process.env.NEXT_PUBLIC_RPC_URL || deployment?.rpcUrl) ||
  "https://api.devnet.solana.com";
export const NAV_KEY = `assetra:nav:${CLUSTER}`;

const clusterParam =
  CLUSTER === "devnet" ? "cluster=devnet" : `cluster=custom&customUrl=${encodeURIComponent(RPC_URL)}`;
export const explorerTx = (sig: string) => `https://explorer.solana.com/tx/${sig}?${clusterParam}`;
export const explorerAddress = (addr: string) => `https://explorer.solana.com/address/${addr}?${clusterParam}`;
export const mainnetAddress = (addr: string) => `https://explorer.solana.com/address/${addr}`;

export const NETWORK_LABEL = CLUSTER === "devnet" ? "Devnet" : "Localnet";
