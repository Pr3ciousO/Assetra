"use client";

import { LinkSquare02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";
import { Skeleton } from "@/components/ui/Skeleton";
import { TokenIcon } from "@/components/ui/TokenIcon";
import { useIndexState, useTessera } from "@/hooks/useData";
import { deployment, explorerAddress, mainnetAddress } from "@/lib/config";
import { int, shortAddr, usd, usdCompact } from "@/lib/format";


export function Constituents() {
  const { data: tessera } = useTessera();
  const { data: s } = useIndexState();
  const comps = deployment?.components ?? [];
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {comps.map((c, i) => {
        const t = tessera?.find((x) => x.id === c.tesseraId);
        return (
          <Reveal key={c.symbol} delay={i * 0.08}>
            <Card hover className="h-full p-5">
              <div className="mb-6 flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <TokenIcon symbol={c.symbol} size={32} />
                  <div className="min-w-0">
                    <span className="block text-sm text-ghost">{c.symbol}</span>
                    <span className="block truncate text-[11px] text-steel" title={t?.sector ?? c.sector}>{t?.sector ?? c.sector}</span>
                  </div>
                </div>
                <Badge>{s ? `${(s.weights[i] * 100).toFixed(1)}%` : "—"}</Badge>
              </div>
              <div className="mb-5 text-3xl font-extralight tracking-tight">{t ? usd(t.markPrice) : <Skeleton className="h-8 w-28" />}</div>
              <dl className="mb-5 space-y-2 text-xs">
                <div className="flex justify-between"><dt className="text-steel">Valuation</dt><dd className="text-ash">{t ? usdCompact(t.markValuation) : "—"}</dd></div>
                <div className="flex justify-between"><dt className="text-steel">Tessera holders</dt><dd className="text-ash">{t ? int(t.holders) : "—"}</dd></div>
              </dl>
              <div className="glass-inset space-y-1.5 px-3 py-2.5 text-[11px]">
                <a href={mainnetAddress(c.realMint)} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-2 whitespace-nowrap text-steel transition-colors hover:text-ghost">
                  <span>Mainnet</span>
                  <span className="flex items-center gap-1">{shortAddr(c.realMint)} <HugeiconsIcon icon={LinkSquare02Icon} size={11} /></span>
                </a>
                <a href={explorerAddress(c.mint)} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-2 whitespace-nowrap text-steel transition-colors hover:text-ghost">
                  <span>Devnet demo</span>
                  <span className="flex items-center gap-1">{shortAddr(c.mint)} <HugeiconsIcon icon={LinkSquare02Icon} size={11} /></span>
                </a>
              </div>
            </Card>
          </Reveal>
        );
      })}
    </div>
  );
}
