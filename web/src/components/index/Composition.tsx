"use client";

import { motion } from "motion/react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { TokenIcon } from "@/components/ui/TokenIcon";
import { useIndexState, useTessera } from "@/hooks/useData";
import { deployment } from "@/lib/config";
import { usd } from "@/lib/format";
import { COMPONENT_COLORS } from "./palette";

export function Composition() {
  const { data: s } = useIndexState();
  const { data: tessera } = useTessera();
  const comps = deployment?.components ?? [];

  return (
    <Card>
      <CardHeader label="Composition" hint="Each FRNT holds fixed units of every T-Token. Weights drift as prices move, like any real index." />
      <div className="space-y-6 p-5">
        <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-white/[0.04]">
          {comps.map((c, i) => (
            <motion.div
              key={c.symbol}
              className="h-full"
              style={{ background: COMPONENT_COLORS[i] }}
              initial={{ width: 0 }}
              whileInView={{ width: `${((s?.weights[i] ?? c.weightBps / 10000) * 100).toFixed(2)}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.1 * i, ease: [0.16, 1, 0.3, 1] }}
            />
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-xs">
            <thead>
              <tr className="text-left">
                {["Asset", "Units / FRNT", "Mark price", "Value / FRNT", "Launch", "Live"].map((h, i) => (
                  <th key={h} className={`label pb-3 font-normal ${i ? "text-right" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comps.map((c, i) => {
                const t = tessera?.find((x) => x.id === c.tesseraId);
                return (
                  <tr key={c.symbol} className="divider border-t">
                    <td className="py-3.5">
                      <span className="flex items-center gap-2.5">
                        <TokenIcon symbol={c.symbol} size={20} />
                        <span className="text-ghost">{c.symbol}</span>
                        <span className="hidden text-steel sm:inline">{t?.sector ?? c.sector}</span>
                      </span>
                    </td>
                    <td className="text-right text-ash">{(Number(c.units) / 1e9).toFixed(6)}</td>
                    <td className="text-right text-ash">{s ? usd(s.prices[i]) : <Skeleton className="h-3 w-16" />}</td>
                    <td className="text-right text-ghost">{s ? usd(s.valuePerIndex[i]) : <Skeleton className="h-3 w-14" />}</td>
                    <td className="text-right text-steel">{(c.weightBps / 100).toFixed(1)}%</td>
                    <td className="text-right text-ghost">{s ? `${(s.weights[i] * 100).toFixed(1)}%` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}
