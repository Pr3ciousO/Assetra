"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";

/** When a wallet connects with no SOL for fees, ask the sponsor endpoint for a small devnet grant (once per session). */
export function SponsorOnConnect() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const qc = useQueryClient();

  useEffect(() => {
    if (!publicKey) return;
    const key = `assetra:sponsored:${publicKey.toBase58()}`;
    if (sessionStorage.getItem(key)) return;
    let cancelled = false;
    (async () => {
      const lamports = await connection.getBalance(publicKey).catch(() => null);
      if (cancelled || lamports === null || lamports >= 0.02 * LAMPORTS_PER_SOL) return;
      sessionStorage.setItem(key, "1");
      const id = toast.loading("Funding your wallet", { description: "Sending devnet SOL for fees…" });
      try {
        const res = await fetch("/api/sponsor", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ address: publicKey.toBase58() }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "Sponsor unavailable");
        toast.success("Wallet funded", { id, description: "0.05 devnet SOL for fees. Next: claim dUSDC." });
        qc.invalidateQueries();
      } catch (e) {
        toast.error("Couldn't fund wallet", { id, description: `${(e as Error).message}. Use faucet.solana.com for devnet SOL.` });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [publicKey, connection, qc]);

  return null;
}
