"use client";

import { AssetraClient } from "@assetra/sdk";
import { useConnection } from "@solana/wallet-adapter-react";
import { useMemo } from "react";
import { deployment } from "@/lib/config";

/** SDK client bound to the current connection, or null if this cluster isn't deployed. */
export function useAssetra(): AssetraClient | null {
  const { connection } = useConnection();
  return useMemo(() => (deployment ? new AssetraClient(connection, deployment) : null), [connection]);
}
