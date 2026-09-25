"use client";

import { DropletIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button, type ButtonProps } from "@/components/ui/Button";
import { useAssetra } from "@/hooks/useAssetra";
import { useSendTx } from "@/hooks/useSendTx";

/** Claims 5,000 demo USDC from the desk faucet. */
export function FaucetButton({ label = "Get dUSDC", ...props }: ButtonProps & { label?: string }) {
  const client = useAssetra();
  const { publicKey } = useWallet();
  const tx = useSendTx();
  if (!client || !publicKey) return null;
  return (
    <Button
      variant="secondary"
      size="sm"
      loading={tx.isPending}
      onClick={() => tx.mutate({ label: "Claim 5,000 dUSDC", build: (owner) => client.faucetIx(owner) })}
      {...props}
    >
      {!tx.isPending && <HugeiconsIcon icon={DropletIcon} size={13} />}
      {label}
    </Button>
  );
}
