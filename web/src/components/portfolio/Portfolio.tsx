"use client";

import {
  ArrowDown01Icon,
  ArrowUpRight01Icon,
  Coins01Icon,
  DropletIcon,
  Exchange01Icon,
  Layers01Icon,
  RepeatIcon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { toUi } from "@assetra/sdk";
import { useWallet } from "@solana/wallet-adapter-react";
import { motion } from "motion/react";
import Link from "next/link";
import { COMPONENT_COLORS } from "@/components/index/palette";
import { TokenIcon } from "@/components/ui/TokenIcon";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { NumberTicker } from "@/components/ui/NumberTicker";
import { RadialGlow } from "@/components/ui/RadialGlow";
import { Reveal } from "@/components/ui/Reveal";
import { Skeleton } from "@/components/ui/Skeleton";
import { useWalletModal } from "@/components/wallet/WalletModal";
import { useActivity, type ActivityKind } from "@/hooks/useActivity";
import { useIndexState, usePlans, useWalletState } from "@/hooks/useData";
import { deployment, explorerTx } from "@/lib/config";
import { num, usd } from "@/lib/format";

const KIND: Record<ActivityKind, { label: string; icon: IconSvgElement }> = {
  buy: { label: "Bought FRNT", icon: Coins01Icon },
  mint: { label: "Minted in kind", icon: Layers01Icon },
  redeem: { label: "Redeemed in kind", icon: ArrowDown01Icon },
  "plan-run": { label: "Auto-Invest run", icon: RepeatIcon },
  "plan-created": { label: "Plan created", icon: RepeatIcon },
  "plan-cancelled": { label: "Plan cancelled", icon: RepeatIcon },
  faucet: { label: "Faucet claim", icon: DropletIcon },
  "desk-buy": { label: "Bought T-Token", icon: Exchange01Icon },
  "desk-sell": { label: "Sold T-Token", icon: Exchange01Icon },
};

export function Portfolio() {
  const { publicKey } = useWallet();
  const { open } = useWalletModal();
  const { data: w } = useWalletState();
  const { data: s } = useIndexState();
  const { data: plans } = usePlans();
  const { data: activity, isLoading: loadingActivity } = useActivity(publicKey);
  const comps = deployment?.components ?? [];

  if (!publicKey) {
    return (
      <Card className="mx-auto grid max-w-lg place-items-center p-12 text-center">
        <HugeiconsIcon icon={Wallet01Icon} size={30} strokeWidth={1.2} className="mb-5 text-steel" />
        <p className="mb-6 text-sm text-ash">Connect a wallet to see your frontier exposure.</p>
        <Button onClick={open}>Connect wallet</Button>
      </Card>
    );
  }

  const frnt = w ? toUi(w.index, 9) : 0;
  const frntValue = s ? frnt * s.nav : 0;
  const direct = w && s ? w.components.map((b, i) => toUi(b, 9) * s.prices[i]) : comps.map(() => 0);
  const lookThrough = s ? s.valuePerIndex.map((v, i) => v * frnt + direct[i]) : [];
  const exposureTotal = lookThrough.reduce((a, b) => a + b, 0);
  const usdc = w ? toUi(w.usdc, 6) : 0;
  const total = frntValue + direct.reduce((a, b) => a + b, 0) + usdc;
  const active = plans?.filter((p) => p.status === "active") ?? [];
  const planInvested = plans?.reduce((a, p) => a + toUi(p.totalSpent, 6), 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Reveal>
          <Card className="h-full overflow-hidden p-6 md:p-8">
            <RadialGlow className="-left-20 -top-28 h-72 w-[30rem]" intensity={0.1} />
            <p className="label relative mb-4">Total value</p>
            <div className="relative mb-8 text-5xl font-extralight tracking-tight md:text-6xl">
              {w && s ? <NumberTicker value={total} format={usd} /> : <Skeleton className="h-14 w-64" />}
            </div>
            <dl className="glass-inset relative grid grid-cols-3 gap-4 p-4 text-xs">
              <div><dt className="label mb-2">FRNT</dt><dd className="text-ghost">{num(frnt, 4)}</dd><dd className="text-[10px] text-steel">{usd(frntValue)}</dd></div>
              <div><dt className="label mb-2">T-Tokens held</dt><dd className="text-ghost">{usd(direct.reduce((a, b) => a + b, 0))}</dd></div>
              <div><dt className="label mb-2">dUSDC</dt><dd className="text-ghost">{usd(usdc)}</dd></div>
            </dl>
          </Card>
        </Reveal>
        <Reveal delay={0.05}>
          <Card className="h-full">
            <CardHeader label="Auto-Invest" right={<Link href="/auto-invest" className="label transition-colors hover:text-frontier">Manage →</Link>} />
            <dl className="grid grid-cols-2 gap-6 p-5 text-xs">
              <div><dt className="label mb-2">Active plans</dt><dd className="text-2xl font-light text-ghost">{plans ? active.length : "—"}</dd></div>
              <div><dt className="label mb-2">Invested via plans</dt><dd className="text-2xl font-light text-ghost">{usd(planInvested)}</dd></div>
              <div className="col-span-2 text-[11px] leading-relaxed text-steel">
                {active.length
                  ? `Next run ${new Date(Math.min(...active.map((p) => p.nextRunTs)) * 1000).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}.`
                  : "No active plans."}
              </div>
            </dl>
          </Card>
        </Reveal>
      </div>

      <Reveal>
        <Card>
          <CardHeader label="Look-through exposure" hint="What you really own: your FRNT's share of the vault plus any T-Tokens you hold directly." />
          <div className="space-y-5 p-5">
            {comps.map((c, i) => {
              const v = lookThrough[i] ?? 0;
              const share = exposureTotal ? v / exposureTotal : 0;
              return (
                <div key={c.symbol}>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2.5">
                      <TokenIcon symbol={c.symbol} size={20} />
                      <span className="text-ghost">{c.name.replace(/^T-/, "")}</span>
                      <span className="text-steel">{c.symbol}</span>
                    </span>
                    <span>
                      <span className="text-ghost">{usd(v)}</span>
                      <span className="ml-3 text-steel">{(share * 100).toFixed(1)}%</span>
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: COMPONENT_COLORS[i] }}
                      initial={{ width: 0 }}
                      animate={{ width: `${share * 100}%` }}
                      transition={{ duration: 1.1, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                </div>
              );
            })}
            {exposureTotal === 0 && w && (
              <div className="glass-inset flex flex-wrap items-center justify-between gap-4 p-4">
                <p className="text-xs text-steel">No exposure yet.</p>
                <Link href="/app"><Button size="sm">Invest now</Button></Link>
              </div>
            )}
          </div>
        </Card>
      </Reveal>

      <Reveal>
        <Card>
          <CardHeader label="Activity" hint="Your on-chain events. Each row opens the transaction in Solana Explorer." />
          <div className="divide-y divide-white/[0.05] px-1 pb-2">
            {loadingActivity && (
              <div className="space-y-3 p-5">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            )}
            {activity?.length === 0 && <p className="p-5 text-xs text-steel">Nothing yet.</p>}
            {activity?.map((a, i) => (
              <motion.a
                key={a.signature + a.kind + i}
                href={explorerTx(a.signature)}
                target="_blank"
                rel="noreferrer"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.4) }}
                className="group flex items-center gap-4 rounded-xl px-4 py-3.5 text-xs transition-colors hover:bg-white/[0.03]"
              >
                <span className="glass-chip grid size-8 shrink-0 place-items-center rounded-[10px] text-ash transition-colors group-hover:text-ghost">
                  <HugeiconsIcon icon={KIND[a.kind].icon} size={14} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-ghost">{KIND[a.kind].label}</span>
                  <span className="block truncate text-[11px] text-steel">
                    {a.detail ? `${a.detail} · ` : ""}
                    {new Date(a.time).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </span>
                <span className="text-right">
                  {a.index !== undefined && <span className="block text-ghost">{a.kind === "redeem" ? "−" : "+"}{num(a.index, 4)} FRNT</span>}
                  {a.usdc !== undefined && <span className="block text-[11px] text-steel">{usd(a.usdc)}</span>}
                </span>
                <HugeiconsIcon icon={ArrowUpRight01Icon} size={14} className="text-steel transition-colors group-hover:text-frontier" />
              </motion.a>
            ))}
          </div>
        </Card>
      </Reveal>
    </div>
  );
}
