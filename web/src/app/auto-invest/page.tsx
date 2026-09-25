import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { PlanForm } from "@/components/plans/PlanForm";
import { PlanList } from "@/components/plans/PlanList";
import { NotDeployed } from "@/components/ui/NotDeployed";
import { Reveal } from "@/components/ui/Reveal";
import { deployment } from "@/lib/config";
import { pageMetadata } from "@/lib/pages";

export const metadata: Metadata = pageMetadata("autoInvest");

export default function AutoInvestPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 pb-10 pt-32 md:px-8 md:pt-28">
      <PageHeader
        kicker="Auto-Invest"
        title={<>Build your position <span className="text-steel">on autopilot.</span></>}
        hint="Plans are on-chain programs. USDC sits in an escrow only your plan can spend, and a permissionless keeper executes each run when it's due. Pause, top up or cancel any time; cancelling refunds everything left."
      />
      {!deployment ? (
        <NotDeployed />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
          <Reveal className="lg:sticky lg:top-24">
            <PlanForm />
          </Reveal>
          <div className="min-w-0">
            <p className="label mb-4">Your plans</p>
            <PlanList />
          </div>
        </div>
      )}
    </div>
  );
}
