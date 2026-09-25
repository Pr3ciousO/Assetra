"use client";

import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
import { Card } from "@/components/ui/Card";
import { NumberTicker } from "@/components/ui/NumberTicker";
import { Reveal } from "@/components/ui/Reveal";
import { useTessera } from "@/hooks/useData";
import { SectionLabel } from "./SectionLabel";

const STATEMENT =
  "The most valuable companies of this decade are private. By the time they list, most of the upside is gone. Until then, access means accreditation, paperwork and five-figure minimums.";

function Word({ word, progress, range }: { word: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.12, 1]);
  const blur = useTransform(progress, range, [4, 0]);
  const filter = useTransform(blur, (b) => `blur(${b}px)`);
  return (
    <motion.span style={{ opacity, filter }} className="mr-[0.28em] inline-block">
      {word}
    </motion.span>
  );
}

export function Problem() {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.45"] });
  const words = STATEMENT.split(" ");
  const { data } = useTessera();
  const val = (id: string) => (data?.find((t) => t.id === id)?.markValuation ?? 0) / 1e9;

  return (
    <section className="mx-auto max-w-7xl px-5 py-32 md:px-8 md:py-44">
      <SectionLabel n="01">The problem</SectionLabel>
      <p ref={ref} className="max-w-5xl text-2xl font-light leading-snug tracking-tight md:text-[2.6rem] md:leading-[1.2]">
        {words.map((w, i) => (
          <Word key={i} word={w} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]} />
        ))}
      </p>
      <div className="mt-20 grid gap-4 md:grid-cols-3">
        {[
          { k: "OpenAI private valuation", v: val("T-OpenAI"), f: (n: number) => `$${Math.round(n)}B` },
          { k: "SpaceX private valuation", v: val("T-SpaceX"), f: (n: number) => `$${Math.round(n)}B` },
          { k: "Typical SPV minimum", v: 10, f: (n: number) => `$${Math.round(n)}K+` },
        ].map((x, i) => (
          <Reveal key={x.k} delay={i * 0.1}>
            <Card hover className="p-6">
              <div className="mb-10 text-4xl font-extralight tracking-tight text-ghost md:text-5xl">
                <NumberTicker value={x.v} format={x.f} duration={1.8} />
              </div>
              <div className="label">{x.k}</div>
            </Card>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
