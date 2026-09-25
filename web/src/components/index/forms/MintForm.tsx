"use client";

import { ceilDiv, previewMintInKind, toUi } from "@assetra/sdk";
import type { TransactionInstruction } from "@solana/web3.js";
import { useState } from "react";
import { AmountInput, Row } from "@/components/ui/AmountInput";
import { parseAmount } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { useAssetra } from "@/hooks/useAssetra";
import { useIndexState, useWalletState } from "@/hooks/useData";
import { useSendTx } from "@/hooks/useSendTx";
import { deployment } from "@/lib/config";
import { num, usd } from "@/lib/format";
import { InfoTip } from "@/components/ui/InfoTip";
import { TokenIcon } from "@/components/ui/TokenIcon";
import { ActionButton } from "./ActionButton";

export function MintForm({ onDone }: { onDone: (msg: string) => void }) {
  const client = useAssetra();
  const { data: s } = useIndexState();
  const { data: w } = useWalletState();
  const tx = useSendTx();
  const acquire = useSendTx();
  const [amount, setAmount] = useState("");

  const indexAmount = parseAmount(amount, 9);
  const preview = (s && indexAmount > 0n ? previewMintInKind(indexAmount, client?.components ?? [], s.mintFeeBps) : null);
  const missing = preview ? preview.legs.map((l, i) => (w ? l.send - w.components[i] : l.send)) : [];
  const short = missing.some((m) => m > 0n);
  const acquireCost = s ? missing.reduce((sum, m, i) => sum + (m > 0n ? ceilDiv(m * s.priced[i].price, 10n ** 9n) + 1n : 0n), 0n) : 0n;

  const buyMissing = () => {
    if (!client || !s) return;
    acquire.mutate({
      label: "Acquire basket from desk",
      build: async (owner) => {
        const ixs: TransactionInstruction[] = [];
        for (const [i, m] of missing.entries()) {
          if (m <= 0n) continue;
          ixs.push(...(await client.deskBuyIxs(owner, i, ceilDiv(m * s.priced[i].price, 10n ** 9n) + 1n)));
        }
        return ixs;
      },
    });
  };

  const submit = () => {
    if (!client || !preview) return;
    tx.mutate(
      { label: `Mint ${num(toUi(indexAmount, 9), 4)} FRNT in kind`, build: (owner) => client.mintInKindIxs(owner, indexAmount) },
      { onSuccess: () => (onDone(`Minted ${num(toUi(preview.indexNet, 9), 4)} FRNT from your T-Tokens.`), setAmount("")) },
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <span className="label">Mint FRNT</span>
        <InfoTip>For T-Token holders. Deposit the exact basket into the vault and mint FRNT. The program verifies what it actually received.</InfoTip>
      </div>
      <AmountInput value={amount} onChange={setAmount} symbol="FRNT" balance={s ? usd(toUi(indexAmount, 9) * s.nav) : undefined} balanceLabel="Value" />
      <div className="glass-inset px-4 py-3">
        <p className="mb-2 flex items-center gap-1.5">
          <span className="label">You deposit</span>
          <InfoTip>Includes Tessera&apos;s 0.20% Token-2022 transfer fee on each T-Token.</InfoTip>
        </p>
        {deployment?.components.map((c, i) => {
          const have = w?.components[i] ?? 0n;
          const need = preview?.legs[i].send ?? 0n;
          return (
            <Row
              key={c.symbol}
              label={
                <span className="flex items-center gap-2">
                  <TokenIcon symbol={c.symbol} size={16} />
                  {c.symbol}
                </span>
              }
              value={<span className={preview && have < need ? "text-danger" : undefined}>{preview ? num(toUi(need, 9), 6) : "—"}</span>}
              sub={`have ${num(toUi(have, 9), 6)}`}
            />
          );
        })}
        <Row label={`Mint fee (${(s?.mintFeeBps ?? 30) / 100}%)`} hint="Taken in FRNT and kept by the index treasury." value={preview ? `${num(toUi(preview.fee, 9), 6)} FRNT` : "—"} />
        <Row label="You receive" strong value={preview ? `${num(toUi(preview.indexNet, 9), 6)} FRNT` : "—"} />
      </div>
      {preview && short && (
        <Button variant="secondary" className="w-full" loading={acquire.isPending} onClick={buyMissing}>
          Buy missing T-Tokens · {usd(toUi(acquireCost, 6))}
        </Button>
      )}
      <ActionButton onClick={submit} loading={tx.isPending} disabled={!preview || short || s?.paused}>
        {preview ? (short ? "Missing components" : `Mint ${num(toUi(indexAmount, 9), 4)} FRNT`) : "Enter an amount"}
      </ActionButton>
    </div>
  );
}
