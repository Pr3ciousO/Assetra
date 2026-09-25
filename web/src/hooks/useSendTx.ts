"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Transaction, type PublicKey, type TransactionInstruction } from "@solana/web3.js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { friendlyError } from "@/lib/errors";
import { TxLink } from "@/components/ui/TxLink";

export interface TxRequest {
  label: string;
  build: (owner: PublicKey) => Promise<TransactionInstruction[]>;
}

/** Build → sign → confirm → toast → refresh every query. */
export function useSendTx() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ label, build }: TxRequest) => {
      if (!publicKey) throw new Error("Connect a wallet first");
      const id = toast.loading(label, { description: "Approve in your wallet" });
      try {
        const ixs = await build(publicKey);
        // Finalized blockhashes are known to every RPC node, avoiding "Blockhash not found" on lagging nodes.
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("finalized");
        const tx = new Transaction({ feePayer: publicKey, blockhash, lastValidBlockHeight }).add(...ixs);
        const signature = await sendTransaction(tx, connection, { preflightCommitment: "confirmed" });
        toast.loading(label, { id, description: "Confirming on Solana…" });
        const res = await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");
        if (res.value.err) throw new Error(`Transaction failed: ${JSON.stringify(res.value.err)}`);
        toast.success(label, { id, description: TxLink({ signature }) });
        await qc.invalidateQueries();
        return signature;
      } catch (e) {
        console.error(e);
        toast.error(label, { id, description: friendlyError(e) });
        throw e;
      }
    },
  });
}
