"use client";

import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Buffer } from "buffer";
import { useMemo, useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { SponsorOnConnect } from "@/components/wallet/SponsorOnConnect";
import { WalletModalProvider } from "@/components/wallet/WalletModal";
import { DemoWalletAdapter } from "@/lib/wallet/DemoWalletAdapter";
import { RPC_URL } from "@/lib/config";

if (typeof window !== "undefined") (window as unknown as { Buffer: typeof Buffer }).Buffer ??= Buffer;

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } } }),
  );
  const wallets = useMemo(() => [new DemoWalletAdapter()], []);
  return (
    <QueryClientProvider client={queryClient}>
      <ConnectionProvider endpoint={RPC_URL} config={{ commitment: "confirmed" }}>
        {/* Wallet Standard wallets (Phantom, Solflare, Backpack…) register themselves. */}
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <SponsorOnConnect />
            {children}
            <Toaster
              position="bottom-right"
              theme="dark"
              toastOptions={{
                classNames: {
                  toast: "!bg-carbon/80 !backdrop-blur-xl !border-0 !shadow-[inset_0_1px_0_rgb(255_255_255/0.07),0_20px_50px_-20px_rgb(0_0_0/0.9)] !text-ghost !font-mono !rounded-2xl",
                  description: "!text-ash !text-xs",
                },
              }}
            />
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </QueryClientProvider>
  );
}
