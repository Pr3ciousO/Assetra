import type { Metadata } from "next";
import { AutoInvestSection } from "@/components/landing/AutoInvestSection";
import { FinalCta } from "@/components/landing/FinalCta";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { IndexSection } from "@/components/landing/IndexSection";
import { Problem } from "@/components/landing/Problem";
import { ProofSection } from "@/components/landing/ProofSection";
import { Ticker } from "@/components/landing/Ticker";
import { WhySolana } from "@/components/landing/WhySolana";
import { pageMetadata } from "@/lib/pages";

export const metadata: Metadata = pageMetadata("home");

export default function Home() {
  return (
    <>
      <Hero />
      <Ticker />
      <Problem />
      <IndexSection />
      <HowItWorks />
      <AutoInvestSection />
      <ProofSection />
      <WhySolana />
      <FinalCta />
    </>
  );
}
