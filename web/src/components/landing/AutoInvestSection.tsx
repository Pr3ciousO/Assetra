"use client";

import { CheckmarkCircle02Icon, RepeatIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion } from "motion/react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "./SectionLabel";

const RUNS = 26;

export function AutoInvestSection() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-32 md:px-8">
      <SectionLabel n="04">Autopilot</SectionLabel>
      <div className="grid items-center gap-16 lg:grid-cols-[1fr_1.1fr]">
        <Reveal className="space-y-6">
          <h2 className="text-4xl font-light leading-[1.05] tracking-tight md:text-5xl">
            $25 a week.
            <br />
            <span className="text-steel">Forever, if you like.</span>
          </h2>
          <p className="max-w-lg text-sm leading-relaxed text-ash">
            Auto-Invest plans live on-chain. Your USDC sits in an escrow only the plan can spend, on a schedule only you can change.
            When a run is due, anyone can execute it and earn a one-cent tip. No broker, no market hours, no custody.
          </p>
          <ul className="space-y-2.5 text-xs text-ash">
            {["Daily, weekly or monthly", "Pause, top up or cancel any time", "Cancelling refunds every unspent cent"].map((x) => (
              <li key={x} className="flex items-center gap-3">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} strokeWidth={1.6} className="text-frontier" /> {x}
              </li>
            ))}
          </ul>
          <Link href="/auto-invest" className="inline-block pt-2">
            <Button variant="secondary">
              <HugeiconsIcon icon={RepeatIcon} size={14} /> Set up a plan
            </Button>
          </Link>
        </Reveal>

        <Reveal delay={0.1}>
          <Card className="p-6 md:p-8">
            <div className="mb-8 flex items-center justify-between">
              <span className="label">Plan · $25 weekly · 26 runs</span>
              <span className="text-[11px] text-frontier">Active</span>
            </div>
            <div className="grid grid-cols-13 gap-2">
              {Array.from({ length: RUNS }).map((_, i) => (
                <motion.span
                  key={i}
                  className="aspect-square rounded-[5px]"
                  initial={{ backgroundColor: "rgba(255,255,255,0.05)", boxShadow: "0 0 0 0 rgba(10,245,0,0)" }}
                  whileInView={
                    i < 17
                      ? { backgroundColor: "rgba(10,245,0,0.85)", boxShadow: "0 0 12px -3px rgba(10,245,0,0.7)" }
                      : i === 17
                        ? { backgroundColor: "rgba(10,245,0,0.18)" }
                        : {}
                  }
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ delay: 0.2 + i * 0.06, duration: 0.3 }}
                />
              ))}
            </div>
            <div className="glass-inset mt-8 grid grid-cols-3 gap-4 p-4 text-xs">
              <div><div className="label mb-2">Invested</div><div className="text-ghost">$425.00</div></div>
              <div><div className="label mb-2">Runs</div><div className="text-ghost">17 / 26</div></div>
              <div><div className="label mb-2">Next run</div><div className="text-frontier">in 2d 4h</div></div>
            </div>
            <p className="mt-6 text-[10px] text-steel">Illustration. Create a real plan on devnet in the app.</p>
          </Card>
        </Reveal>
      </div>
    </section>
  );
}
