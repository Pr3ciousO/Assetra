"use client";

import { SecurityCheckIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ceilDiv, INDEX_UNIT } from "@assetra/sdk";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { TokenIcon } from "@/components/ui/TokenIcon";
import { useIndexState } from "@/hooks/useData";
import { deployment, explorerAddress } from "@/lib/config";
import { num, shortAddr } from "@/lib/format";


export function Reserves() {
  const { data: s } = useIndexState();
  const comps = deployment?.components ?? [];
  const rows = comps.map((c, i) => {
    const held = s?.vaults[i] ?? 0n;
    const required = s ? ceilDiv(s.supply * BigInt(c.units), INDEX_UNIT) : 0n;
    const coverage = required > 0n ? Number((held * 10000n) / required) / 100 : 100;
    return { c, held, required, coverage };
  });
  const minCoverage = rows.length ? Math.min(...rows.map((r) => r.coverage)) : 100;

  return (
    <Card>
      <CardHeader
        label="Proof of reserves"
        hint="Required = FRNT supply × units, rounded up. Minting and redeeming happen in kind, so backing never depends on an oracle."
        right={
          <Badge tone={minCoverage >= 100 ? "green" : "warn"}>
            <HugeiconsIcon icon={SecurityCheckIcon} size={12} />
            {minCoverage >= 100 ? "Fully backed" : `${minCoverage.toFixed(2)}% backed`}
          </Badge>
        }
      />
      <div className="divide-y divide-white/[0.05] px-1 pb-2">
        {rows.map(({ c, held, required, coverage }) => (
          <div key={c.symbol} className="grid gap-3 px-5 py-4 text-xs sm:grid-cols-[1fr_auto]">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <TokenIcon symbol={c.symbol} size={20} />
                <span className="text-ghost">{c.symbol} vault</span>
                <a href={explorerAddress(c.vault)} target="_blank" rel="noreferrer" className="text-steel transition-colors hover:text-frontier">
                  {shortAddr(c.vault)} ↗
                </a>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <motion.div
                  className="h-full rounded-full bg-frontier/80"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${Math.min(coverage, 100)}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6 text-right sm:w-[340px]">
              <div><div className="label mb-1.5">Held</div><div className="text-ghost">{num(Number(held) / 1e9, 6)}</div></div>
              <div><div className="label mb-1.5">Required</div><div className="text-ash">{num(Number(required) / 1e9, 6)}</div></div>
              <div><div className="label mb-1.5">Cover</div><div className="text-frontier">{required > 0n ? `${coverage.toFixed(2)}%` : "—"}</div></div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
