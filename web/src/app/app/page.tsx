import type { Metadata } from "next";
import { Composition } from "@/components/index/Composition";
import { Constituents } from "@/components/index/Constituents";
import { InvestPanel } from "@/components/index/InvestPanel";
import { NavHero } from "@/components/index/NavHero";
import { Reserves } from "@/components/index/Reserves";
import { NotDeployed } from "@/components/ui/NotDeployed";
import { Reveal } from "@/components/ui/Reveal";
import { deployment } from "@/lib/config";
import { pageMetadata } from "@/lib/pages";

export const metadata: Metadata = pageMetadata("index");

export default function IndexPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 pb-10 pt-32 md:px-8 md:pt-28">
      {!deployment ? (
        <NotDeployed />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="min-w-0 space-y-6">
            <Reveal>
              <NavHero />
            </Reveal>
            <Reveal delay={0.05}>
              <Composition />
            </Reveal>
            <div>
              <p className="label mb-4">Constituents · live from Tessera</p>
              <Constituents />
            </div>
            <Reveal>
              <Reserves />
            </Reveal>
          </div>
          <Reveal delay={0.1} className="lg:sticky lg:top-24">
            <InvestPanel />
          </Reveal>
        </div>
      )}
    </div>
  );
}
