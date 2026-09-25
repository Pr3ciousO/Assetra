"use client";

import { RepeatIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";
import { Skeleton } from "@/components/ui/Skeleton";
import { usePlans } from "@/hooks/useData";
import { parsedAmount } from "@/lib/token";
import { PlanCard } from "./PlanCard";

export function PlanList() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const { data: plans, isLoading } = usePlans();
  const { data: escrows } = useQuery({
    queryKey: ["escrows", plans?.map((p) => p.address.toBase58()).join()],
    enabled: !!plans?.length,
    refetchInterval: 10_000,
    queryFn: async () => {
      const infos = await connection.getMultipleParsedAccounts(plans!.map((p) => p.escrow));
      return infos.value.map(parsedAmount);
    },
  });

  if (!publicKey) {
    return (
      <Card className="grid place-items-center p-10 text-center">
        <HugeiconsIcon icon={RepeatIcon} size={28} strokeWidth={1.2} className="mb-4 text-steel" />
        <p className="text-sm text-ash">Connect a wallet to see your plans.</p>
      </Card>
    );
  }
  if (isLoading) return <Skeleton className="h-56 w-full" />;
  if (!plans?.length) {
    return (
      <Card className="grid place-items-center p-10 text-center">
        <HugeiconsIcon icon={RepeatIcon} size={28} strokeWidth={1.2} className="mb-4 text-steel" />
        <p className="mb-1 text-sm text-ash">No plans yet.</p>
        <p className="text-xs text-steel">Pick &quot;1 min&quot; to watch the keeper execute runs live.</p>
      </Card>
    );
  }
  return (
    <div className="space-y-4">
      {plans.map((p, i) => (
        <Reveal key={p.address.toBase58()} delay={i * 0.05}>
          <PlanCard plan={p} escrow={escrows?.[i] ?? 0n} />
        </Reveal>
      ))}
    </div>
  );
}
