import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Portfolio } from "@/components/portfolio/Portfolio";
import { NotDeployed } from "@/components/ui/NotDeployed";
import { deployment } from "@/lib/config";

export const metadata: Metadata = { title: "Portfolio" };

export default function PortfolioPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 pb-10 pt-32 md:px-8 md:pt-28">
      <PageHeader kicker="Portfolio" title={<>Your slice <span className="text-steel">of the frontier.</span></>} />
      {deployment ? <Portfolio /> : <NotDeployed />}
    </div>
  );
}
