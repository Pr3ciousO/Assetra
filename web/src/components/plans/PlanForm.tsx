"use client";

import { toUi } from "@assetra/sdk";
import { motion } from "motion/react";
import { useState } from "react";
import { AmountInput, Row } from "@/components/ui/AmountInput";
import { Clock01Icon, FlashIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Card, CardHeader } from "@/components/ui/Card";
import { ActionButton } from "@/components/index/forms/ActionButton";
import { FaucetButton } from "@/components/wallet/FaucetButton";
import { useAssetra } from "@/hooks/useAssetra";
import { useIndexState, useWalletState } from "@/hooks/useData";
import { useNow } from "@/hooks/useNow";
import { useSendTx } from "@/hooks/useSendTx";
import { cn } from "@/lib/cn";
import { newPlanId, parseAmount, usd } from "@/lib/format";

const FREQS = [
  { label: "1 min", secs: 60, demo: true },
  { label: "Daily", secs: 86_400 },
  { label: "Weekly", secs: 604_800 },
  { label: "Monthly", secs: 2_592_000 },
];
const RUNS = [4, 12, 26, 52];

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative rounded-[10px] px-3 py-2.5 text-[11px] tracking-wider transition-all duration-300",
        active ? "bg-frontier/[0.1] text-ghost shadow-[inset_0_1px_0_rgb(10_245_0/0.18)]" : "glass-chip text-ash hover:bg-white/[0.09] hover:text-ghost",
      )}
    >
      {children}
    </button>
  );
}

export function PlanForm() {
  const client = useAssetra();
  const { data: s } = useIndexState();
  const { data: w } = useWalletState();
  const tx = useSendTx();
  const [amount, setAmount] = useState("25");
  const [freq, setFreq] = useState(FREQS[0]);
  const [runs, setRuns] = useState(12);

  const perRun = parseAmount(amount, 6);
  const tip = s?.keeperTip ?? 10_000n;
  const deposit = (perRun + tip) * BigInt(runs);
  const balance = w?.usdc ?? 0n;
  const insufficient = deposit > balance;
  const valid = perRun >= 1_000_000n;

  const now = useNow(30_000);
  const schedule = Array.from({ length: Math.min(runs, 5) }, (_, i) => new Date(now + i * freq.secs * 1000));

  const submit = () => {
    if (!client || !valid) return;
    const id = newPlanId();
    tx.mutate({
      label: `Start ${freq.secs === 60 ? "every-minute" : freq.label.toLowerCase()} plan · ${usd(toUi(perRun, 6))}`,
      build: (owner) => client.createPlanIxs(owner, { id, usdcPerRun: perRun, intervalSecs: freq.secs, totalRuns: runs, deposit }),
    });
  };

  return (
    <Card>
      <CardHeader label="New plan" hint="The first run executes right away. After that, a permissionless keeper runs each one when it's due." />
      <div className="space-y-6 p-5">
        <div>
          <p className="label mb-3">Amount per run</p>
          <AmountInput value={amount} onChange={setAmount} prefix="$" symbol="dUSDC" balance={w ? usd(toUi(balance, 6)) : undefined} />
        </div>
        <div>
          <p className="label mb-3">Frequency</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {FREQS.map((f) => (
              <Choice key={f.secs} active={freq.secs === f.secs} onClick={() => setFreq(f)}>
                {f.label}
                {f.demo && <span className="absolute -top-2 right-2 rounded-full bg-frontier px-1.5 py-px text-[8px] uppercase tracking-[0.15em] text-void">demo</span>}
              </Choice>
            ))}
          </div>
        </div>
        <div>
          <p className="label mb-3">Number of runs</p>
          <div className="grid grid-cols-4 gap-2">
            {RUNS.map((r) => (
              <Choice key={r} active={runs === r} onClick={() => setRuns(r)}>
                {r}
              </Choice>
            ))}
          </div>
        </div>

        <div>
          <p className="label mb-3">Schedule</p>
          <div className="flex items-center gap-1.5">
            {schedule.map((d, i) => (
              <motion.div
                key={`${freq.secs}-${i}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-inset flex-1 rounded-[10px] px-2 py-2 text-center"
              >
                <HugeiconsIcon
                  icon={i === 0 ? FlashIcon : Clock01Icon}
                  size={12}
                  strokeWidth={1.8}
                  className={cn("mx-auto mb-1.5", i === 0 ? "text-frontier drop-shadow-[0_0_6px_rgb(10_245_0/0.8)]" : "text-steel")}
                />
                <div className="text-[10px] text-ash">
                  {freq.secs < 86_400
                    ? d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
                    : d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </div>
              </motion.div>
            ))}
            {runs > 5 && <span className="px-1 text-[11px] text-steel">+{runs - 5}</span>}
          </div>
        </div>

        <div className="glass-inset px-4 py-3">
          <Row label="Per run" value={usd(toUi(perRun, 6))} />
          <Row label="Keeper tip per run" hint="Paid to whoever executes the run, so plans keep running without us." value={usd(toUi(tip, 6))} />
          <Row label="Escrow deposit" hint="Held by the plan's on-chain escrow. Cancel any time to get every unspent cent back." strong value={usd(toUi(deposit, 6))} />
        </div>

        {w && balance === 0n ? (
          <FaucetButton label="Claim 5,000 dUSDC first" size="lg" variant="accent" className="w-full" />
        ) : (
          <ActionButton onClick={submit} loading={tx.isPending} disabled={!valid || insufficient || s?.paused}>
            {insufficient ? "Insufficient dUSDC" : valid ? `Start plan · deposit ${usd(toUi(deposit, 6))}` : "Minimum $1 per run"}
          </ActionButton>
        )}
      </div>
    </Card>
  );
}
