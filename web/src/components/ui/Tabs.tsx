"use client";

import { motion } from "motion/react";
import { useId } from "react";
import { cn } from "@/lib/cn";

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  const id = useId();
  return (
    <div role="tablist" className={cn("glass-inset relative grid p-1", className)} style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={cn(
            "relative rounded-[9px] py-2.5 text-[11px] uppercase tracking-[0.2em] transition-colors duration-300",
            value === t.value ? "text-ghost" : "text-steel hover:text-ash",
          )}
        >
          {value === t.value && (
            <motion.span
              layoutId={`tab-${id}`}
              className="glass-chip absolute inset-0 rounded-[9px]"
              transition={{ type: "spring", stiffness: 400, damping: 34 }}
            >
              <span className="absolute inset-x-1/3 bottom-0 h-px bg-frontier shadow-[0_0_10px_rgb(10_245_0/0.8)]" />
            </motion.span>
          )}
          <span className="relative">{t.label}</span>
        </button>
      ))}
    </div>
  );
}
