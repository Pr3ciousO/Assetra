import type { Deployment } from "../deployment";
import devnet from "./devnet.json";
import localnet from "./localnet.json";

const all: Record<string, { index?: string }> = { devnet, localnet };

/** Deployment for a cluster, or null if it hasn't been bootstrapped yet. */
export function getDeployment(cluster: string): Deployment | null {
  const d = all[cluster];
  return d && d.index ? (d as unknown as Deployment) : null;
}
