"use client";

import { ArrowRight01Icon, Rocket01Icon, SignalIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion, useScroll, useTransform } from "motion/react";
import Link from "next/link";
import { useRef } from "react";
import { COMPONENT_COLORS } from "@/components/index/palette";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { NumberTicker } from "@/components/ui/NumberTicker";
import { TokenIcon } from "@/components/ui/TokenIcon";
import { useLiveNav } from "@/hooks/useLiveNav";
import { deployment } from "@/lib/config";
import { usd } from "@/lib/format";
import { HeroBackdrop } from "./HeroBackdrop";

const EASE = [0.16, 1, 0.3, 1] as const;

function SplitWord({ word, delay }: { word: string; delay: number }) {
  return (
    <span className="inline-block overflow-hidden pb-[0.08em] align-bottom">
      <motion.span
        className="inline-block"
        initial={{ y: "105%" }}
        animate={{ y: "0%" }}
        transition={{ duration: 1.1, delay, ease: EASE }}
      >
        {word}
      </motion.span>
    </span>
  );
}

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const cardY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const titleY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const { nav, weights } = useLiveNav();
  const comps = deployment?.components ?? [];

  return (
    <section ref={ref} className="relative isolate flex min-h-[100svh] items-center overflow-hidden pt-32 md:pt-24">
      <HeroBackdrop />

      <div className="mx-auto grid w-full max-w-7xl items-center gap-14 px-5 md:px-8 lg:grid-cols-[1.35fr_1fr]">
        <motion.div style={{ y: titleY, opacity: fade }}>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE }}>
            <Badge tone="green" icon={Rocket01Icon} className="mb-8">
              Pre-IPO index · Built on Tessera
            </Badge>
          </motion.div>
          <h1 className="text-[clamp(3rem,9vw,7.5rem)] font-extralight leading-[0.92] tracking-[-0.04em]">
            <SplitWord word="Own" delay={0.1} /> <SplitWord word="the" delay={0.18} />
            <br />
            <span className="relative">
              <SplitWord word="frontier" delay={0.26} />
              <motion.span
                aria-hidden
                className="ml-2 inline-block h-[0.72em] w-[0.14em] translate-y-[0.06em] bg-frontier shadow-[0_0_24px_rgb(10_245_0/0.8)]"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 1, 0, 0, 1] }}
                transition={{ duration: 1.6, delay: 1, repeat: Infinity, repeatDelay: 0.2, times: [0, 0.05, 0.5, 0.55, 0.95, 1] }}
              />
            </span>
          </h1>
          <motion.p
            className="mt-8 max-w-xl text-sm leading-relaxed text-ash md:text-base"
            initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1, delay: 0.6, ease: EASE }}
          >
            One token backed by OpenAI, SpaceX and Kalshi. Invest once or on autopilot, and redeem for the real tokens any time.
            The index fund for private markets, on Solana.
          </motion.p>
          <motion.div
            className="mt-10 flex flex-wrap items-center gap-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.8, ease: EASE }}
          >
            <Link href="/app">
              <Button size="lg">
                Launch app <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
              </Button>
            </Link>
            <a href="#how">
              <Button size="lg" variant="secondary">How it works</Button>
            </a>
          </motion.div>
        </motion.div>

        {/* Floating live NAV card */}
        <motion.div
          style={{ y: cardY }}
          initial={{ opacity: 0, y: 40, rotateX: 12, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)" }}
          transition={{ duration: 1.4, delay: 0.5, ease: EASE }}
          className="relative [perspective:1200px]"
        >
          <div className="glass relative p-6">
            <div className="mb-6 flex items-center justify-between">
              <span className="label">FRNT · Net asset value</span>
              <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-frontier">
                <HugeiconsIcon icon={SignalIcon} size={12} strokeWidth={1.8} className="animate-pulse" /> Live
              </span>
            </div>
            <div className="mb-8 text-5xl font-extralight tracking-tight md:text-6xl">
              {nav !== null ? <NumberTicker value={nav} format={usd} duration={2} /> : "$—"}
            </div>
            <div className="mb-3 flex h-1.5 gap-0.5 overflow-hidden rounded-full">
              {comps.map((c, i) => (
                <motion.div
                  key={c.symbol}
                  style={{ background: COMPONENT_COLORS[i] }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(weights[i] ?? 0) * 100}%` }}
                  transition={{ duration: 1.4, delay: 1 + i * 0.12, ease: EASE }}
                />
              ))}
            </div>
            <div className="space-y-2.5 pt-3">
              {comps.map((c, i) => (
                <div key={c.symbol} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2.5 text-ash">
                    <TokenIcon symbol={c.symbol} size={18} />
                    {c.symbol}
                  </span>
                  <span className="text-ghost">{((weights[i] ?? 0) * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
            <div className="hairline my-5" />
            <div className="flex justify-between text-[11px] text-steel">
              <span>100% backed in kind</span>
              <span>Redeem any time</span>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        aria-hidden
        style={{ opacity: fade }}
        className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 md:flex"
      >
        <span className="label">Scroll</span>
        <span className="relative h-10 w-px overflow-hidden rounded-full bg-white/10">
          <motion.span
            className="absolute inset-x-0 top-0 h-4 bg-frontier"
            animate={{ y: [-16, 40] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
        </span>
      </motion.div>
    </section>
  );
}
