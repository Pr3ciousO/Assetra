"use client";

import { motion } from "motion/react";
import { COMPONENT_COLORS } from "@/components/index/palette";
import { Reveal } from "@/components/ui/Reveal";
import { TokenIcon } from "@/components/ui/TokenIcon";
import { RadialGlow } from "@/components/ui/RadialGlow";
import { useLiveNav } from "@/hooks/useLiveNav";
import { deployment } from "@/lib/config";
import { usd } from "@/lib/format";
import { SectionLabel } from "./SectionLabel";

const R = 120;
const C = 2 * Math.PI * R;

export function IndexSection() {
  const { nav, weights, tessera } = useLiveNav();
  const comps = deployment?.components ?? [];
  // Cumulative arc offsets for each constituent segment.
  const offsets = comps.map((_, i) => weights.slice(0, i).reduce((a, w) => a + (w ?? 0) * C, 0));

  return (
    <section className="relative mx-auto max-w-7xl px-5 py-32 md:px-8">
      <SectionLabel n="02">One token</SectionLabel>
      <div className="grid items-center gap-16 lg:grid-cols-2">
        <Reveal className="space-y-6">
          <h2 className="text-4xl font-light leading-[1.05] tracking-tight md:text-5xl">
            The Frontier Index.
            <br />
            <span className="text-steel">Three companies, one token.</span>
          </h2>
          <p className="max-w-lg text-sm leading-relaxed text-ash">
            FRNT holds fixed amounts of Tessera&apos;s T-OpenAI, T-SpaceX and T-Kalshi. It launched at $100 with capped weights
            (45 / 40 / 15), so Kalshi still counts next to two near-trillion-dollar giants. Weights drift with price, like any real
            index.
          </p>
          <div className="space-y-2 pt-4">
            {comps.map((c, i) => {
              const t = tessera?.find((x) => x.id === c.tesseraId);
              return (
                <div key={c.symbol} className="glass glass-hover flex items-center justify-between rounded-[14px] px-4 py-3 text-xs">
                  <span className="flex items-center gap-3">
                    <TokenIcon symbol={c.symbol} size={22} />
                    <span className="text-ghost">{c.symbol}</span>
                    <span className="text-steel">{t?.sector ?? c.sector}</span>
                  </span>
                  <span className="flex items-center gap-2.5 text-ash">
                    <span className="h-1 w-6 rounded-full" style={{ background: COMPONENT_COLORS[i] }} />
                    {((weights[i] ?? 0) * 100).toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        </Reveal>
        <div className="relative mx-auto aspect-square w-full max-w-[420px]">
          <RadialGlow className="inset-10" intensity={0.12} />
          <svg viewBox="0 0 300 300" className="relative size-full -rotate-90">
            <circle cx="150" cy="150" r={R} fill="none" stroke="rgb(255 255 255 / 0.08)" strokeWidth="1" strokeDasharray="2 5" />
            {comps.map((c, i) => {
              const len = (weights[i] ?? 0) * C;
              return (
                <motion.circle
                  key={c.symbol}
                  cx="150"
                  cy="150"
                  r={R}
                  fill="none"
                  stroke={COMPONENT_COLORS[i]}
                  strokeWidth={i === 0 ? 10 : 6}
                  strokeDashoffset={-offsets[i]}
                  initial={{ strokeDasharray: `0 ${C}` }}
                  whileInView={{ strokeDasharray: `${Math.max(len - 4, 0)} ${C}` }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 1.4, delay: 0.2 + i * 0.25, ease: [0.16, 1, 0.3, 1] }}
                  style={i === 0 ? { filter: "drop-shadow(0 0 8px rgb(10 245 0 / 0.6))" } : undefined}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="label mb-3">1 FRNT</span>
            <span className="text-4xl font-extralight tracking-tight md:text-5xl">{nav !== null ? usd(nav) : "$—"}</span>
            <span className="mt-3 text-[11px] text-steel">live NAV</span>
          </div>
        </div>
      </div>
    </section>
  );
}
