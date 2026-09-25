"use client";

import { useIndexState, useTessera } from "./useData";
import { deployment } from "@/lib/config";

/** NAV + per-constituent data for marketing surfaces: on-chain when deployed, Tessera otherwise. */
export function useLiveNav() {
  const { data: s } = useIndexState();
  const { data: tessera } = useTessera();
  const comps = deployment?.components ?? [];
  const fallbackNav =
    tessera && comps.length
      ? comps.reduce((sum, c) => sum + (Number(c.units) / 1e9) * (tessera.find((t) => t.id === c.tesseraId)?.markPrice ?? 0), 0)
      : null;
  return {
    nav: s?.nav ?? fallbackNav,
    weights: s?.weights ?? comps.map((c) => c.weightBps / 10000),
    supply: s ? Number(s.supply) / 1e9 : null,
    state: s,
    tessera,
  };
}
