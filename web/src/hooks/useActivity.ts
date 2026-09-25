"use client";

import { type Assetra, type DemoDesk } from "@assetra/sdk";
import { BorshCoder, EventParser, type Idl } from "@coral-xyz/anchor";
import { useConnection } from "@solana/wallet-adapter-react";
import type { PublicKey } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import { useAssetra } from "./useAssetra";
import { QK } from "./useData";

export type ActivityKind = "buy" | "mint" | "redeem" | "plan-run" | "plan-created" | "plan-cancelled" | "faucet" | "desk-buy" | "desk-sell";

export interface ActivityItem {
  signature: string;
  time: number;
  kind: ActivityKind;
  usdc?: number;
  index?: number;
  detail?: string;
}

/** Recent Assetra + desk events touching `address`, newest first. */
export function useActivity(address?: PublicKey | null, limit = 25) {
  const client = useAssetra();
  const { connection } = useConnection();
  return useQuery({
    queryKey: QK.activity(address?.toBase58()),
    enabled: !!client && !!address,
    refetchInterval: 20_000,
    queryFn: async (): Promise<ActivityItem[]> => {
      const c = client!;
      const parsers = [
        new EventParser(c.program.programId, new BorshCoder(c.program.idl as Assetra as unknown as Idl)),
        new EventParser(c.desk.programId, new BorshCoder(c.desk.idl as DemoDesk as unknown as Idl)),
      ];
      const sigs = await connection.getSignaturesForAddress(address!, { limit });
      const txs = await connection.getTransactions(
        sigs.filter((s) => !s.err).map((s) => s.signature),
        { maxSupportedTransactionVersion: 0, commitment: "confirmed" },
      );
      const symbol = (mint: PublicKey) => c.components.find((x) => x.mint.equals(mint))?.symbol ?? "token";
      const items: ActivityItem[] = [];
      for (const tx of txs) {
        if (!tx?.meta?.logMessages) continue;
        const base = { signature: tx.transaction.signatures[0], time: (tx.blockTime ?? 0) * 1000 };
        for (const parser of parsers) {
          for (const ev of parser.parseLogs(tx.meta.logMessages)) {
            const d = ev.data as Record<string, { toString(): string } | undefined>;
            const n = (v: { toString(): string } | undefined, dec: number) => Number(v?.toString() ?? 0) / 10 ** dec;
            switch (ev.name) {
              case "indexBought":
                items.push({ ...base, kind: "buy", usdc: n(d.usdcSpent, 6), index: n(d.amount, 9) });
                break;
              case "indexMinted":
                items.push({ ...base, kind: "mint", index: n(d.amount, 9) });
                break;
              case "indexRedeemed":
                items.push({ ...base, kind: "redeem", index: n(d.amount, 9) });
                break;
              case "planExecuted":
                items.push({ ...base, kind: "plan-run", usdc: n(d.usdcSpent, 6), index: n(d.amount, 9), detail: `Run ${String(d.run)}` });
                break;
              case "planCreated":
                items.push({ ...base, kind: "plan-created", usdc: n(d.usdcPerRun, 6) });
                break;
              case "planCancelled":
                items.push({ ...base, kind: "plan-cancelled", usdc: n(d.refunded, 6) });
                break;
              case "faucetClaimed":
                items.push({ ...base, kind: "faucet", usdc: n(d.amount, 6) });
                break;
              case "traded":
                items.push({
                  ...base,
                  kind: (d.isBuy as unknown as boolean) ? "desk-buy" : "desk-sell",
                  usdc: n(d.usdcAmount, 6),
                  detail: `${n(d.tokenAmount, 9).toFixed(6)} ${symbol(d.mint as unknown as PublicKey)}`,
                });
                break;
            }
          }
        }
      }
      // A USDC buy or plan run emits desk trades into the vaults; keep the parent event only.
      const parents = new Set(items.filter((i) => i.kind === "buy" || i.kind === "plan-run").map((i) => i.signature));
      return items.filter((i) => !(i.kind === "desk-buy" && parents.has(i.signature))).sort((a, b) => b.time - a.time);
    },
  });
}
