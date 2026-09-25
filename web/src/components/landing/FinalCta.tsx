"use client";

import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { RadialGlow } from "@/components/ui/RadialGlow";
import { Reveal } from "@/components/ui/Reveal";

export function FinalCta() {
  return (
    <section className="relative mx-auto max-w-7xl overflow-hidden px-5 py-40 text-center md:px-8">
      <RadialGlow className="left-1/2 top-1/2 h-[28rem] w-[56rem] -translate-x-1/2 -translate-y-1/2" intensity={0.13} />
      <Reveal className="relative">
        <p className="label mb-8">Start with $25</p>
        <h2 className="mx-auto max-w-4xl text-5xl font-extralight leading-[0.95] tracking-[-0.03em] md:text-8xl">
          The frontier is
          <br />
          <span className="text-glow text-frontier">open.</span>
        </h2>
        <div className="mt-12 flex justify-center">
          <Link href="/app">
            <Button size="lg">
              Launch app <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
            </Button>
          </Link>
        </div>
        <p className="mt-8 text-[11px] text-steel">Devnet demo · claim free dUSDC in the app</p>
      </Reveal>
    </section>
  );
}
