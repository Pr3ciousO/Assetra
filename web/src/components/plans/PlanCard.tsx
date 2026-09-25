"use client";

import { Cancel01Icon, CheckmarkCircle02Icon, PauseIcon, PlayIcon, PlusSignCircleIcon, PlusSignIcon, RepeatIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { fromUi, toUi, type PlanView } from "@assetra/sdk";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAssetra } from "@/hooks/useAssetra";
import { useActivity } from "@/hooks/useActivity";
import { useIndexState } from "@/hooks/useData";
import { useNow } from "@/hooks/useNow";
import { useSendTx } from "@/hooks/useSendTx";
import { cn } from "@/lib/cn";
import { explorerTx } from "@/lib/config";
import { cadence, duration, num, usd } from "@/lib/format";

export function PlanCard({ plan, escrow }: { plan: PlanView; escrow: bigint }) {
  const client = useAssetra();
  const { data: s } = useIndexState();
  const tx = useSendTx();
  const now = useNow();
  const [open, setOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [topUp, setTopUp] = useState("");
  const { data: runs } = useActivity(open ? plan.address : null, 20);

  const tip = s?.keeperTip ?? 0n;
  const underfunded = plan.status === "active" && escrow < plan.usdcPerRun + tip;
  const nextIn = plan.nextRunTs - now / 1000;
  const progress = plan.totalRuns ? plan.runsDone / plan.totalRuns : 0;
  const value = s ? toUi(plan.totalIndexBought, 9) * s.nav : 0;
  const tone = plan.status === "active" ? (underfunded ? "warn" : "green") : "neutral";
  const statusLabel = plan.status === "active" ? (underfunded ? "Needs top-up" : "Active") : plan.status === "paused" ? "Paused" : "Completed";

  const act = (label: string, build: Parameters<typeof tx.mutate>[0]["build"]) => tx.mutate({ label, build });

  return (
    <Card hover className="overflow-hidden">
      <div className="p-5">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="mb-1.5 text-lg font-light text-ghost">
              {usd(toUi(plan.usdcPerRun, 6))} <span className="text-steel">· {cadence(plan.intervalSecs).toLowerCase()}</span>
            </div>
            <div className="text-[11px] text-steel">Started {new Date(plan.createdAt * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
          </div>
          <Badge
            tone={tone}
            icon={plan.status === "active" ? (underfunded ? PlusSignCircleIcon : PlayIcon) : plan.status === "paused" ? PauseIcon : CheckmarkCircle02Icon}
            pulse={plan.status === "active" && !underfunded}
          >
            {statusLabel}
          </Badge>
        </div>

        <div className="mb-5">
          <div className="mb-2 flex justify-between text-[11px]">
            <span className="text-steel">Runs</span>
            <span className="text-ash">{plan.runsDone} / {plan.totalRuns || "∞"}</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div className="h-full rounded-full bg-frontier" initial={{ width: 0 }} animate={{ width: `${progress * 100}%` }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} />
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
          <div><dt className="label mb-2">Invested</dt><dd className="text-ghost">{usd(toUi(plan.totalSpent, 6))}</dd></div>
          <div><dt className="label mb-2">FRNT bought</dt><dd className="text-ghost">{num(toUi(plan.totalIndexBought, 9), 4)}</dd><dd className="text-[10px] text-steel">{usd(value)}</dd></div>
          <div><dt className="label mb-2">Escrow</dt><dd className={underfunded ? "text-yellow-300" : "text-ghost"}>{usd(toUi(escrow, 6))}</dd></div>
          <div>
            <dt className="label mb-2">Next run</dt>
            <dd className={cn(plan.status === "active" ? "text-frontier" : "text-steel")}>
              {plan.status === "completed" ? "—" : plan.status === "paused" ? "paused" : nextIn <= 0 ? "due · keeper" : `in ${duration(nextIn)}`}
            </dd>
          </div>
        </dl>
      </div>

      {plan.status !== "completed" && (
        <div className="glass-inset mx-3 mb-3 flex flex-wrap items-center gap-2 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <input
              value={topUp}
              onChange={(e) => /^\d*\.?\d*$/.test(e.target.value) && setTopUp(e.target.value)}
              placeholder="Top up $"
              className="h-8 w-24 rounded-[9px] bg-white/[0.04] px-2.5 text-xs shadow-[inset_0_1px_2px_rgb(0_0_0/0.5)] outline-none transition-colors placeholder:text-steel focus:bg-white/[0.07]"
            />
            <Button
              size="sm"
              variant="secondary"
              disabled={!client || !topUp || Number(topUp) <= 0}
              onClick={() => {
                const amt = fromUi(topUp, 6);
                act(`Top up plan ${usd(Number(topUp))}`, (owner) => client!.topUpPlanIxs(owner, plan.address, amt));
                setTopUp("");
              }}
            >
              <HugeiconsIcon icon={PlusSignIcon} size={12} />
            </Button>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              disabled={!client || tx.isPending}
              onClick={() =>
                act(plan.status === "active" ? "Pause plan" : "Resume plan", (owner) =>
                  client!.setPlanPausedIxs(owner, plan.address, plan.status === "active"),
                )
              }
            >
              <HugeiconsIcon icon={plan.status === "active" ? PauseIcon : PlayIcon} size={12} />
              {plan.status === "active" ? "Pause" : "Resume"}
            </Button>
            {confirmCancel ? (
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  setConfirmCancel(false);
                  act(`Cancel plan · refund ${usd(toUi(escrow, 6))}`, (owner) => client!.cancelPlanIxs(owner, plan.address));
                }}
              >
                Confirm refund {usd(toUi(escrow, 6))}
              </Button>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => setConfirmCancel(true)}>
                <HugeiconsIcon icon={Cancel01Icon} size={12} /> Cancel
              </Button>
            )}
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full px-5 pb-4 pt-1 text-left text-[10px] uppercase tracking-[0.2em] text-steel transition-colors hover:text-ash"
      >
        {open ? "Hide" : "Show"} run history
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-1 px-5 pb-4">
              {!runs && <p className="py-2 text-[11px] text-steel">Loading…</p>}
              {runs?.filter((r) => r.kind === "plan-run" || r.kind === "plan-created").map((r) => (
                <a
                  key={r.signature + r.kind}
                  href={explorerTx(r.signature)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between py-1.5 text-[11px] text-ash transition-colors hover:text-ghost"
                >
                  <span className="flex items-center gap-2.5">
                    <HugeiconsIcon
                      icon={r.kind === "plan-run" ? RepeatIcon : PlusSignCircleIcon}
                      size={12}
                      strokeWidth={1.8}
                      className={r.kind === "plan-run" ? "text-frontier" : "text-steel"}
                    />
                    {r.kind === "plan-run" ? r.detail : "Plan created"}
                  </span>
                  <span className="text-steel">
                    {r.kind === "plan-run" ? `${usd(r.usdc ?? 0)} → ${num(r.index ?? 0, 4)} FRNT` : ""} · {new Date(r.time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} ↗
                  </span>
                </a>
              ))}
              {runs && runs.length === 0 && <p className="py-2 text-[11px] text-steel">No runs yet.</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
