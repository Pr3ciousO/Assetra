"use client";

import { ArrowRight01Icon, Cancel01Icon, Wallet01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";
import { AnimatePresence, motion } from "motion/react";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { DemoWalletName } from "@/lib/wallet/DemoWalletAdapter";

const Ctx = createContext<{ open: () => void }>({ open: () => {} });
export const useWalletModal = () => useContext(Ctx);

export function WalletModalProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const { wallets, select, connecting, connected } = useWallet();
  const open = useCallback(() => setVisible(true), []);

  useEffect(() => {
    if (!visible || connected) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setVisible(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, connected]);

  const detected = wallets.filter(
    (w) =>
      w.adapter.name !== DemoWalletName &&
      (w.readyState === WalletReadyState.Installed || w.readyState === WalletReadyState.Loadable),
  );
  const demo = wallets.find((w) => w.adapter.name === DemoWalletName);

  return (
    <Ctx.Provider value={{ open }}>
      {children}
      <AnimatePresence>
        {visible && !connected && (
          <motion.div
            className="fixed inset-0 z-[80] grid place-items-center bg-void/70 p-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setVisible(false)}
            data-lenis-prevent
          >
            <motion.div
              role="dialog"
              aria-modal
              aria-label="Connect a wallet"
              className="glass relative w-full max-w-sm"
              initial={{ opacity: 0, y: 20, scale: 0.97, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 12, scale: 0.98, filter: "blur(6px)" }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 pb-2 pt-5">
                <span className="label">Connect wallet</span>
                <button aria-label="Close" onClick={() => setVisible(false)} className="text-steel transition-colors hover:text-ghost">
                  <HugeiconsIcon icon={Cancel01Icon} size={16} />
                </button>
              </div>
              {demo && (
                <div className="p-3">
                  <button
                    onClick={() => select(demo.adapter.name)}
                    disabled={connecting}
                    className="group relative flex w-full items-center gap-3 overflow-hidden rounded-xl bg-frontier/[0.07] px-3 py-3.5 text-left shadow-[inset_0_1px_0_rgb(10_245_0/0.15)] transition-all duration-300 hover:bg-frontier/[0.12] hover:shadow-[inset_0_1px_0_rgb(10_245_0/0.25),0_10px_30px_-12px_rgb(10_245_0/0.4)]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={demo.adapter.icon} alt="" className="size-7" />
                    <span className="flex-1">
                      <span className="block text-sm text-ghost">Try instantly</span>
                      <span className="block text-[11px] text-steel">In-browser demo wallet · funded with devnet SOL</span>
                    </span>
                    <HugeiconsIcon icon={ArrowRight01Icon} size={16} className="text-frontier transition-transform duration-300 group-hover:translate-x-1" />
                  </button>
                </div>
              )}
              <div className="p-3">
                {detected.length > 0 && <p className="label px-3 pb-2 pt-1">Your wallets</p>}
                {detected.length === 0 && (
                  <div className="px-3 py-6 text-center text-xs leading-relaxed text-ash">
                    No extension wallet detected. Use the demo wallet above, or install{" "}
                    <a className="text-ghost underline underline-offset-4 hover:text-frontier" href="https://phantom.com" target="_blank" rel="noreferrer">
                      Phantom
                    </a>{" "}
                    or{" "}
                    <a className="text-ghost underline underline-offset-4 hover:text-frontier" href="https://solflare.com" target="_blank" rel="noreferrer">
                      Solflare
                    </a>{" "}
                    and switch it to devnet.
                  </div>
                )}
                {detected.map((w, i) => (
                  <motion.button
                    key={w.adapter.name}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08 + i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    disabled={connecting}
                    onClick={() => select(w.adapter.name)}
                    className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition-all duration-300 hover:bg-white/[0.05]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={w.adapter.icon} alt="" className="size-7" />
                    <span className="flex-1">{w.adapter.name}</span>
                    <span className="label opacity-0 transition-opacity group-hover:opacity-100">Detected</span>
                  </motion.button>
                ))}
              </div>
              <div className="flex items-center gap-2 px-5 pb-4 pt-1 text-[11px] text-steel">
                <HugeiconsIcon icon={Wallet01Icon} size={14} />
                Assetra runs on Solana devnet with demo assets.
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Ctx.Provider>
  );
}
