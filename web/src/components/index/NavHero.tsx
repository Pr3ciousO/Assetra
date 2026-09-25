"use client";

import { SignalIcon } from "@hugeicons/core-free-icons";
import { useMemo } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { InfoTip } from "@/components/ui/InfoTip";
import { NumberTicker } from "@/components/ui/NumberTicker";
import { RadialGlow } from "@/components/ui/RadialGlow";
import { Skeleton } from "@/components/ui/Skeleton";
import { useIndexState, useNavHistory } from "@/hooks/useData";
import { deployment } from "@/lib/config";
import { cn } from "@/lib/cn";
import { num, pct, usd, usdCompact } from "@/lib/format";
import { NavChart } from "./NavChart";

export function NavHero() {
  const { data: s, dataUpdatedAt } = useIndexState();
  const { data: history = [] } = useNavHistory();
  const launchNav = deployment ? Number(deployment.launchNavMicro) / 1e6 : 100;

  const points = useMemo(() => (s ? [...history, { t: dataUpdatedAt, nav: s.nav }] : history), [history, s, dataUpdatedAt]);
  const rawChange = s ? ((s.nav - launchNav) / launchNav) * 100 : 0;
  // Units are floored at launch, so NAV can sit a hair under $100: treat sub-cent drift as flat.
  const change = Math.abs(rawChange) < 0.005 ? 0 : rawChange;
  const supply = s ? Number(s.supply) / 1e9 : 0;

  return (
    <Card className="overflow-hidden">
      <RadialGlow className="-left-24 -top-32 h-80 w-[36rem]" intensity={0.12} />
      <div className="relative flex flex-wrap items-start justify-between gap-6 p-6 md:p-8">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="label">Frontier Index · {deployment?.indexSymbol ?? "FRNT"}</span>
            <InfoTip>
              Each FRNT is backed by a fixed basket of T-OpenAI, T-SpaceX and T-Kalshi in an on-chain vault. NAV is that
              basket&apos;s live Tessera mark value.
            </InfoTip>
            <Badge tone="green" icon={SignalIcon} pulse>Live NAV</Badge>
          </div>
          <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
            {s ? (
              <NumberTicker value={s.nav} format={usd} className="text-5xl font-extralight tracking-tight text-ghost md:text-7xl" />
            ) : (
              <Skeleton className="h-16 w-72" />
            )}
            {s && (
              <span className={cn("mb-2 text-sm", change > 0 ? "text-frontier" : change < 0 ? "text-danger" : "text-ash")}>
                {pct(change)} <span className="text-steel">since launch</span>
              </span>
            )}
          </div>
        </div>
      </div>
      <dl className="glass-inset relative mx-4 grid grid-cols-2 md:mx-6 md:grid-cols-4">
        {[
          { k: "Supply", v: s ? `${num(supply, 4)} FRNT` : null },
          { k: "Backed value", v: s ? usdCompact(supply * s.nav) : null },
          { k: "Constituents", v: s ? `${s.priced.length} T-Tokens` : null },
          { k: "Mint / redeem", v: s ? `${s.mintFeeBps / 100}% / ${s.redeemFeeBps / 100}%` : null },
        ].map((x, i) => (
          <div key={x.k} className={cn("divider px-5 py-4 md:px-6", i % 2 === 1 && "border-l", i >= 2 && "border-t md:border-t-0", i === 2 && "md:border-l")}>
            <dt className="label mb-2">{x.k}</dt>
            <dd className="text-sm text-ghost">{x.v ?? <Skeleton className="h-4 w-20" />}</dd>
          </div>
        ))}
      </dl>
      <div className="relative px-2 pb-2 pt-4 md:px-4">
        <NavChart points={points} />
      </div>
    </Card>
  );
}
