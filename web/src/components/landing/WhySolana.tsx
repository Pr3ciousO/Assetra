"use client";

import { Clock01Icon, FlashIcon, GlobeIcon, Layers01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "./SectionLabel";

const REASONS = [
  { icon: FlashIcon, title: "Sub-cent fees", body: "Buying $5 of a three-asset basket only works when a transaction costs a fraction of a cent." },
  { icon: Clock01Icon, title: "24/7 schedules", body: "Recurring buys execute on-chain at any hour, with no broker and no market close." },
  { icon: Layers01Icon, title: "Composable", body: "FRNT is a standard token, ready for DEX pools, lending markets and payments." },
  { icon: GlobeIcon, title: "Where the assets live", body: "Tessera's T-Tokens are Solana-native. The index lives next to what it holds." },
];

export function WhySolana() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-32 md:px-8">
      <SectionLabel n="06">Why Solana</SectionLabel>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {REASONS.map((r, i) => (
          <Reveal key={r.title} delay={i * 0.08}>
            <Card hover className="h-full p-6">
              <HugeiconsIcon icon={r.icon} size={22} strokeWidth={1.3} className="mb-10 text-ash" />
              <h3 className="mb-3 text-sm text-ghost">{r.title}</h3>
              <p className="text-xs leading-relaxed text-steel">{r.body}</p>
            </Card>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
