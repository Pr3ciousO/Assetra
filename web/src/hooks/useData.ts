"use client";

import { navMicro, toUi, type PricedComponent, type TesseraToken } from "@assetra/sdk";
import { useWallet } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { deployment } from "@/lib/config";
import { useAssetra } from "./useAssetra";

export const QK = {
  tessera: ["tessera"],
  index: ["index-state"],
  wallet: (owner?: string) => ["wallet", owner],
  plans: (owner?: string) => ["plans", owner],
  nav: ["nav-history"],
  activity: (addr?: string) => ["activity", addr],
} as const;

export function useTessera() {
  return useQuery({
    queryKey: QK.tessera,
    queryFn: async (): Promise<TesseraToken[]> => {
      const res = await fetch("/api/tessera");
      if (!res.ok) throw new Error("Tessera unavailable");
      return res.json();
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export interface IndexState {
  paused: boolean;
  mintFeeBps: number;
  redeemFeeBps: number;
  keeperTip: bigint;
  supply: bigint;
  vaults: bigint[];
  priced: PricedComponent[];
  /** USD per whole component token, in index order. */
  prices: number[];
  feedUpdatedAt: number[];
  /** USD value of each component inside 1 FRNT. */
  valuePerIndex: number[];
  /** Live weights (0..1). */
  weights: number[];
  nav: number;
}

export function useIndexState() {
  const client = useAssetra();
  return useQuery({
    queryKey: QK.index,
    enabled: !!client,
    refetchInterval: 15_000,
    queryFn: async (): Promise<IndexState> => {
      const c = client!;
      const [idx, feeds, supply, vaults] = await Promise.all([
        c.fetchIndex(),
        c.fetchFeeds(),
        c.fetchSupply(),
        c.fetchVaultBalances(),
      ]);
      const priced = c.components.map((comp, i) => ({ units: comp.units, decimals: comp.decimals, price: feeds[i].price }));
      const valuePerIndex = priced.map((p) => (toUi(p.units, p.decimals) * Number(p.price)) / 1e6);
      const nav = Number(navMicro(priced)) / 1e6;
      return {
        paused: idx.paused,
        mintFeeBps: idx.mintFeeBps,
        redeemFeeBps: idx.redeemFeeBps,
        keeperTip: BigInt(idx.keeperTip.toString()),
        supply,
        vaults,
        priced,
        prices: feeds.map((f) => Number(f.price) / 1e6),
        feedUpdatedAt: feeds.map((f) => f.updatedAt),
        valuePerIndex,
        weights: valuePerIndex.map((v) => (nav ? v / nav : 0)),
        nav,
      };
    },
  });
}

export function useWalletState() {
  const client = useAssetra();
  const { publicKey } = useWallet();
  return useQuery({
    queryKey: QK.wallet(publicKey?.toBase58()),
    enabled: !!client && !!publicKey,
    refetchInterval: 15_000,
    queryFn: () => client!.fetchWallet(publicKey!),
  });
}

export function usePlans() {
  const client = useAssetra();
  const { publicKey } = useWallet();
  return useQuery({
    queryKey: QK.plans(publicKey?.toBase58()),
    enabled: !!client && !!publicKey,
    refetchInterval: 10_000,
    queryFn: () => client!.fetchPlans(publicKey!),
  });
}

export interface NavPoint {
  t: number;
  nav: number;
}

export function useNavHistory() {
  return useQuery({
    queryKey: QK.nav,
    refetchInterval: 60_000,
    queryFn: async (): Promise<NavPoint[]> => {
      const res = await fetch("/api/nav");
      const points: NavPoint[] = res.ok ? await res.json() : [];
      const launch = deployment
        ? [{ t: new Date(deployment.createdAt).getTime(), nav: Number(deployment.launchNavMicro) / 1e6 }]
        : [];
      return [...launch, ...points.filter((p) => !launch.length || p.t > launch[0].t)];
    },
  });
}
