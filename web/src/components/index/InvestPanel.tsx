"use client";

import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { BuyForm } from "./forms/BuyForm";
import { MintForm } from "./forms/MintForm";
import { RedeemForm } from "./forms/RedeemForm";

type Tab = "buy" | "mint" | "redeem";

export function InvestPanel() {
  const [tab, setTab] = useState<Tab>("buy");
  const [done, setDone] = useState<string | null>(null);

  const onDone = (msg: string) => {
    setDone(msg);
    setTimeout(() => setDone(null), 4200);
  };

  return (
    <Card className="overflow-hidden">
      <Tabs
        className="mx-5 mt-5"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "buy", label: "Buy" },
          { value: "mint", label: "Mint" },
          { value: "redeem", label: "Redeem" },
        ]}
      />
      <div className="relative p-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: 10, filter: "blur(4px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: -10, filter: "blur(4px)" }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {tab === "buy" && <BuyForm onDone={onDone} />}
            {tab === "mint" && <MintForm onDone={onDone} />}
            {tab === "redeem" && <RedeemForm onDone={onDone} />}
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {done && (
            <motion.div
              className="absolute inset-0 z-10 grid place-items-center bg-carbon/85 backdrop-blur-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex flex-col items-center gap-4 text-center">
                <motion.div
                  initial={{ scale: 0.4, rotate: -30, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 16 }}
                  className="grid size-16 place-items-center rounded-full bg-frontier/[0.08] text-frontier shadow-[inset_0_1px_0_rgb(10_245_0/0.2),0_0_40px_-4px_rgb(10_245_0/0.6)]"
                >
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={30} />
                </motion.div>
                <motion.p initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }} className="max-w-[16rem] text-sm text-ghost">
                  {done}
                </motion.p>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                  <Link href="/portfolio" className="label transition-colors hover:text-frontier">View portfolio →</Link>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}
