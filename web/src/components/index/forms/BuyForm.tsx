"use client";

import { previewBuy, toUi } from "@assetra/sdk";
import { useState } from "react";
import { AmountInput, Row } from "@/components/ui/AmountInput";
import { parseAmount } from "@/lib/format";
import { FaucetButton } from "@/components/wallet/FaucetButton";
import { useAssetra } from "@/hooks/useAssetra";
import { useIndexState, useWalletState } from "@/hooks/useData";
import { useSendTx } from "@/hooks/useSendTx";
import { cn } from "@/lib/cn";
import { deployment } from "@/lib/config";
import { num, usd } from "@/lib/format";
import { InfoTip } from "@/components/ui/InfoTip";
import { TokenIcon } from "@/components/ui/TokenIcon";
import { ActionButton } from "./ActionButton";

const QUICK = [25, 100, 250, 1000];
const SLIPPAGE_BPS = 50n;

export function BuyForm({ onDone }: { onDone: (msg: string) => void }) {
  const client = useAssetra();
  const { data: s } = useIndexState();
  const { data: w } = useWalletState();
  const tx = useSendTx();
  const [amount, setAmount] = useState("");

  const usdcIn = parseAmount(amount, 6);
  const preview = (s && usdcIn > 0n ? previewBuy(usdcIn, s.priced, s.mintFeeBps) : null);
  const balance = w?.usdc ?? 0n;
  const insufficient = usdcIn > balance;
  const minOut = preview ? (preview.indexNet * (10_000n - SLIPPAGE_BPS)) / 10_000n : 0n;

  const submit = () => {
    if (!client || !preview) return;
    tx.mutate(
      { label: `Invest ${usd(toUi(usdcIn, 6))} in FRNT`, build: (owner) => client.buyWithUsdcIxs(owner, usdcIn, minOut) },
      {
        onSuccess: () => {
          onDone(`You now own ${num(toUi(preview.indexNet, 9), 4)} more FRNT.`);
          setAmount("");
        },
      },
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <span className="label">You pay</span>
        <InfoTip>Pay in dUSDC. One transaction buys each T-Token at its Tessera mark price, straight into the vault, and mints FRNT to you.</InfoTip>
      </div>
      <AmountInput
        value={amount}
        onChange={setAmount}
        prefix="$"
        symbol="dUSDC"
        balance={w ? usd(toUi(balance, 6)) : undefined}
        onMax={w ? () => setAmount(String(toUi(balance, 6))) : undefined}
      />
      <div className="grid grid-cols-4 gap-2">
        {QUICK.map((q) => (
          <button
            key={q}
            onClick={() => setAmount(String(q))}
            className={cn(
              "rounded-[10px] py-2 text-[11px] tracking-wider transition-all duration-300",
              amount === String(q) ? "bg-frontier/[0.1] text-frontier shadow-[inset_0_1px_0_rgb(10_245_0/0.18)]" : "glass-chip text-ash hover:bg-white/[0.09] hover:text-ghost",
            )}
          >
            ${q}
          </button>
        ))}
      </div>

      <div className="glass-inset px-4 py-3">
        <Row
          label="You receive"
          strong
          value={preview ? `${num(toUi(preview.indexNet, 9), 6)} FRNT` : "—"}
          sub={preview && s ? `≈ ${usd(toUi(preview.indexNet, 9) * s.nav)}` : undefined}
        />
        {deployment?.components.map((c, i) => (
          <Row
            key={c.symbol}
            label={
              <span className="flex items-center gap-2">
                <TokenIcon symbol={c.symbol} size={16} />
                {c.symbol} → vault
              </span>
            }
            value={preview ? usd(toUi(preview.legs[i].cost, 6)) : "—"}
            sub={preview ? `${num(toUi(preview.legs[i].need, 9), 6)} tokens` : undefined}
          />
        ))}
        <Row label={`Mint fee (${(s?.mintFeeBps ?? 30) / 100}%)`} hint="Taken in FRNT and kept by the index treasury." value={preview ? `${num(toUi(preview.fee, 9), 6)} FRNT` : "—"} />
        <Row label="Execution" hint="Each T-Token leg fills at Tessera's live mark price via the devnet desk." value="Tessera mark price" />
        <Row label="Min. received" hint="0.5% slippage guard. If you'd get less FRNT than this, the transaction reverts." value={preview ? `${num(toUi(minOut, 9), 6)} FRNT` : "—"} />
      </div>

      {w && balance === 0n ? (
        <div className="glass-inset space-y-3 p-4 text-center">
          <p className="text-xs text-ash">You need demo USDC to invest.</p>
          <FaucetButton label="Claim 5,000 dUSDC" size="md" variant="accent" className="w-full" />
        </div>
      ) : (
        <ActionButton
          onClick={submit}
          loading={tx.isPending}
          disabled={!preview || insufficient || s?.paused}
        >
          {insufficient ? "Insufficient dUSDC" : preview ? `Invest ${usd(toUi(usdcIn, 6))}` : "Enter an amount"}
        </ActionButton>
      )}
    </div>
  );
}
