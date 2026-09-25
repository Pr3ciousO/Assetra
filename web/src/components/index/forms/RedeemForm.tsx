"use client";

import { previewRedeem, toUi } from "@assetra/sdk";
import { useState } from "react";
import { AmountInput, Row } from "@/components/ui/AmountInput";
import { parseAmount } from "@/lib/format";
import { useAssetra } from "@/hooks/useAssetra";
import { useIndexState, useWalletState } from "@/hooks/useData";
import { useSendTx } from "@/hooks/useSendTx";
import { deployment } from "@/lib/config";
import { num, usd } from "@/lib/format";
import { InfoTip } from "@/components/ui/InfoTip";
import { TokenIcon } from "@/components/ui/TokenIcon";
import { ActionButton } from "./ActionButton";

export function RedeemForm({ onDone }: { onDone: (msg: string) => void }) {
  const client = useAssetra();
  const { data: s } = useIndexState();
  const { data: w } = useWalletState();
  const tx = useSendTx();
  const [amount, setAmount] = useState("");

  const indexAmount = parseAmount(amount, 9);
  const preview = (s && indexAmount > 0n ? previewRedeem(indexAmount, client?.components ?? [], s.redeemFeeBps) : null);
  const balance = w?.index ?? 0n;
  const insufficient = indexAmount > balance;
  const value = preview && s ? preview.legs.reduce((sum, l, i) => sum + toUi(l.received, 9) * s.prices[i], 0) : 0;

  const submit = () => {
    if (!client || !preview) return;
    tx.mutate(
      { label: `Redeem ${num(toUi(indexAmount, 9), 4)} FRNT`, build: (owner) => client.redeemInKindIxs(owner, indexAmount) },
      { onSuccess: () => (onDone("Redeemed. The underlying T-Tokens are in your wallet."), setAmount("")) },
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <span className="label">Redeem FRNT</span>
        <InfoTip>Always available, even if the index is paused. You get the real underlying T-Tokens, not cash.</InfoTip>
      </div>
      <AmountInput
        value={amount}
        onChange={setAmount}
        symbol="FRNT"
        balance={w ? num(toUi(balance, 9), 6) : undefined}
        onMax={w ? () => setAmount(String(toUi(balance, 9))) : undefined}
      />
      <div className="glass-inset px-4 py-3">
        <p className="mb-2 flex items-center gap-1.5">
          <span className="label">You receive</span>
          <InfoTip>Amounts are after Tessera&apos;s 0.20% Token-2022 transfer fee.</InfoTip>
        </p>
        {deployment?.components.map((c, i) => (
          <Row
            key={c.symbol}
            label={
              <span className="flex items-center gap-2">
                <TokenIcon symbol={c.symbol} size={16} />
                {c.symbol}
              </span>
            }
            value={preview ? num(toUi(preview.legs[i].received, 9), 6) : "—"}
            sub={preview && s ? usd(toUi(preview.legs[i].received, 9) * s.prices[i]) : undefined}
          />
        ))}
        <Row label={`Redeem fee (${(s?.redeemFeeBps ?? 30) / 100}%)`} hint="Taken in FRNT before the basket is paid out." value={preview ? `${num(toUi(preview.fee, 9), 6)} FRNT` : "—"} />
        <Row label="Total value" strong value={preview ? usd(value) : "—"} />
      </div>
      <ActionButton onClick={submit} loading={tx.isPending} disabled={!preview || insufficient}>
        {insufficient ? "Insufficient FRNT" : preview ? `Redeem ${num(toUi(indexAmount, 9), 4)} FRNT` : "Enter an amount"}
      </ActionButton>
    </div>
  );
}
