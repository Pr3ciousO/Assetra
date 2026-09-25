"use client";

import { Coins01Icon, Exchange01Icon, Layers01Icon, SecurityCheckIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion, useScroll, useSpring } from "motion/react";
import { useRef } from "react";
import { Card } from "@/components/ui/Card";
import { SectionLabel } from "./SectionLabel";

const STEPS = [
  {
    icon: Coins01Icon,
    title: "Deposit USDC",
    body: "Pick an amount, from $1 up. The preview shows exactly how it splits across each company before you sign.",
  },
  {
    icon: Exchange01Icon,
    title: "Basket bought into the vault",
    body: "In the same transaction, each T-Token is bought at its Tessera mark price and sent straight to an on-chain vault owned by the program.",
  },
  {
    icon: Layers01Icon,
    title: "FRNT minted to you",
    body: "You receive FRNT for exactly the basket that landed in the vault. It's a standard SPL token you can hold, send or use in DeFi.",
  },
  {
    icon: SecurityCheckIcon,
    title: "Redeem any time",
    body: "Burn FRNT and receive your share of the real T-Tokens, in kind. Nobody can pause or block redemption. Not even us.",
  },
];

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.6", "end 0.6"] });
  const fill = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  return (
    <section id="how" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-32 md:px-8">
      <SectionLabel n="03">How it works</SectionLabel>
      <div ref={ref} className="grid gap-12 lg:grid-cols-[1fr_1.3fr]">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <h2 className="text-4xl font-light leading-tight tracking-tight md:text-5xl">
            One signature.
            <br />
            <span className="text-steel">Four guarantees.</span>
          </h2>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-ash">
            Everything settles atomically on Solana. If any leg fails, the whole transaction reverts. You never hold a half-built
            basket.
          </p>
        </div>
        <div className="relative pl-10">
          {/* Scroll-driven progress rail */}
          <div className="absolute bottom-0 left-3 top-0 w-px bg-white/[0.07]">
            <motion.div
              className="absolute inset-x-0 top-0 h-full origin-top bg-frontier shadow-[0_0_10px_rgb(10_245_0/0.8)]"
              style={{ scaleY: fill }}
            />
          </div>
          <div className="space-y-6">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.title}
                initial="idle"
                whileInView="active"
                viewport={{ margin: "-45% 0px -45% 0px" }}
                className="relative"
              >
                <motion.span
                  variants={{
                    idle: { scale: 1, boxShadow: "0 0 0 0 rgb(10 245 0 / 0)", color: "#808080" },
                    active: { scale: 1.15, boxShadow: "0 0 18px -2px rgb(10 245 0 / 0.6)", color: "#0af500" },
                  }}
                  transition={{ duration: 0.4 }}
                  className="glass-chip absolute -left-[39px] top-6 grid size-[22px] place-items-center rounded-full bg-void"
                >
                  <HugeiconsIcon icon={s.icon} size={11} strokeWidth={2} />
                </motion.span>
                <motion.div
                  variants={{ idle: { opacity: 0.3, x: 14 }, active: { opacity: 1, x: 0 } }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                <Card hover className="p-7">
                  <div className="mb-6 flex items-center justify-between">
                    <HugeiconsIcon icon={s.icon} size={22} strokeWidth={1.3} className="text-ash" />
                    <span className="text-[11px] tracking-[0.2em] text-steel">0{i + 1}</span>
                  </div>
                  <h3 className="mb-3 text-lg text-ghost">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-steel">{s.body}</p>
                </Card>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
