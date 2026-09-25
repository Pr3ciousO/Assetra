"use client";

import { SecurityCheckIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ceilDiv, INDEX_UNIT } from "@assetra/sdk";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";
import { TokenIcon } from "@/components/ui/TokenIcon";
import { useIndexState } from "@/hooks/useData";
import { deployment, explorerAddress } from "@/lib/config";
import { num, shortAddr } from "@/lib/format";
import { SectionLabel } from "./SectionLabel";

export function ProofSection() {
  const { data: s } = useIndexState();
  const comps = deployment?.components ?? [];

  return (
    <section className="mx-auto max-w-7xl px-5 py-32 md:px-8">
      <SectionLabel n="05">Verifiable</SectionLabel>
      <div className="grid gap-16 lg:grid-cols-[1fr_1.2fr]">
        <Reveal className="space-y-6">
          <h2 className="text-4xl font-light leading-[1.05] tracking-tight md:text-5xl">
            Don&apos;t trust.
            <br />
            <span className="text-steel">Check the vault.</span>
          </h2>
          <p className="max-w-lg text-sm leading-relaxed text-ash">
            FRNT is minted and redeemed in kind: T-Tokens in, FRNT out, and back again. The program checks what the vault actually
            received, including Tessera&apos;s 0.20% transfer fee, so backing never depends on a price oracle. Every balance is
            public.
          </p>
          <Link href="/app" className="label inline-block transition-colors hover:text-frontier">
            Open live reserves →
          </Link>
        </Reveal>
        <Reveal delay={0.1}>
          <Card>
            <div className="flex items-center justify-between px-6 pb-2 pt-5">
              <span className="label">Vault reserves</span>
              <span className="flex items-center gap-1.5 text-[11px] text-frontier">
                <HugeiconsIcon icon={SecurityCheckIcon} size={13} /> Fully backed
              </span>
            </div>
            <div className="divide-y divide-white/[0.05] px-2 pb-2">
              {comps.map((c, i) => {
                const held = s?.vaults[i];
                const req = s ? ceilDiv(s.supply * BigInt(c.units), INDEX_UNIT) : undefined;
                return (
                  <div key={c.symbol} className="flex items-center justify-between gap-4 px-4 py-4 text-xs">
                    <span className="flex items-center gap-3">
                      <TokenIcon symbol={c.symbol} size={22} />
                      <span className="text-ghost">{c.symbol}</span>
                      <a href={explorerAddress(c.vault)} target="_blank" rel="noreferrer" className="hidden text-steel transition-colors hover:text-frontier sm:inline">
                        {shortAddr(c.vault)} ↗
                      </a>
                    </span>
                    <span className="text-right">
                      <span className="block text-ghost">{held !== undefined ? num(Number(held) / 1e9, 6) : "—"}</span>
                      <span className="text-[10px] text-steel">required {req !== undefined ? num(Number(req) / 1e9, 6) : "—"}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </Reveal>
      </div>
    </section>
  );
}
