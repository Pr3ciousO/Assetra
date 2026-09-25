"use client";

import { ArrowDown01Icon, Copy01Icon, Logout01Icon, Wallet01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { TokenIcon } from "@/components/ui/TokenIcon";
import { useWalletState } from "@/hooks/useData";
import { usd, shortAddr } from "@/lib/format";
import { useWalletModal } from "./WalletModal";

export function WalletButton() {
  const { publicKey, wallet, disconnect, connecting } = useWallet();
  const { open } = useWalletModal();
  const { data } = useWalletState();
  const [menu, setMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setMenu(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  if (!publicKey) {
    return (
      <Button size="sm" onClick={open} loading={connecting}>
        {!connecting && <HugeiconsIcon icon={Wallet01Icon} size={14} />}
        Connect
      </Button>
    );
  }

  const addr = publicKey.toBase58();
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setMenu((m) => !m)}
        className="glass-chip flex h-8 items-center gap-2 rounded-[11px] px-3 text-[11px] tracking-wider transition-colors duration-300 hover:bg-white/[0.1]"
      >
        {wallet && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={wallet.adapter.icon} alt="" className="size-4" />
        )}
        <span>{shortAddr(addr)}</span>
        <HugeiconsIcon icon={ArrowDown01Icon} size={12} className={menu ? "rotate-180 transition-transform" : "transition-transform"} />
      </button>
      <AnimatePresence>
        {menu && (
          <motion.div
            initial={{ opacity: 0, y: -6, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="glass absolute right-0 top-10 z-50 w-60 overflow-hidden text-xs"
          >
            <div className="glass-inset m-2 space-y-2 p-3">
              <div className="flex justify-between"><span className="flex items-center gap-2 text-steel"><TokenIcon symbol="dUSDC" size={14} />dUSDC</span><span>{data ? usd(Number(data.usdc) / 1e6) : "—"}</span></div>
              <div className="flex justify-between"><span className="flex items-center gap-2 text-steel"><TokenIcon symbol="FRNT" size={14} />FRNT</span><span>{data ? (Number(data.index) / 1e9).toFixed(4) : "—"}</span></div>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(addr);
                toast.success("Address copied");
                setMenu(false);
              }}
              className="flex w-full items-center gap-2.5 px-4 py-3 text-ash transition-colors hover:bg-white/[0.03] hover:text-ghost"
            >
              <HugeiconsIcon icon={Copy01Icon} size={14} /> Copy address
            </button>
            <button
              onClick={() => {
                disconnect();
                setMenu(false);
              }}
              className="flex w-full items-center gap-2.5 px-4 py-3 text-ash transition-colors hover:bg-white/[0.03] hover:text-ghost"
            >
              <HugeiconsIcon icon={Logout01Icon} size={14} /> Disconnect
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
