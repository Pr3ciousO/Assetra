"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { Button, type ButtonProps } from "@/components/ui/Button";
import { useWalletModal } from "@/components/wallet/WalletModal";

/** Primary action that falls back to "Connect wallet" when disconnected. */
export function ActionButton({ children, ...props }: ButtonProps) {
  const { publicKey } = useWallet();
  const { open } = useWalletModal();
  if (!publicKey) {
    return (
      <Button size="lg" className="w-full" onClick={open}>
        Connect wallet
      </Button>
    );
  }
  return (
    <Button size="lg" className="w-full" {...props}>
      {children}
    </Button>
  );
}
