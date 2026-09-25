"use client";

import { cn } from "@/lib/cn";
import { InfoTip } from "./InfoTip";
import { TokenIcon } from "./TokenIcon";

export function AmountInput({
  value,
  onChange,
  symbol,
  balance,
  balanceLabel = "Balance",
  onMax,
  prefix,
  className,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  symbol: string;
  balance?: string;
  balanceLabel?: string;
  onMax?: () => void;
  prefix?: string;
  className?: string;
  autoFocus?: boolean;
}) {
  return (
    <div
      className={cn(
        "glass-inset group px-4 pb-3 pt-4 transition-[background,box-shadow] duration-300 focus-within:bg-white/[0.045] focus-within:shadow-[inset_0_1px_2px_rgb(0_0_0/0.55),0_0_30px_-12px_rgb(10_245_0/0.35)]",
        className,
      )}
    >
      <div className="flex items-baseline gap-2">
        {prefix && <span className="text-3xl font-light text-steel">{prefix}</span>}
        <input
          inputMode="decimal"
          autoFocus={autoFocus}
          placeholder="0"
          value={value}
          onChange={(e) => {
            const v = e.target.value.replace(/,/g, "");
            if (v === "" || /^\d*\.?\d*$/.test(v)) onChange(v);
          }}
          className="w-full min-w-0 bg-transparent text-3xl font-light tracking-tight text-ghost outline-none placeholder:text-graphite"
        />
        <span className="glass-chip flex shrink-0 items-center gap-1.5 rounded-full py-1 pl-1 pr-2.5 text-[10px] uppercase tracking-[0.18em] text-ash">
          <TokenIcon symbol={symbol} size={18} />
          {symbol}
        </span>
      </div>
      {(balance !== undefined || onMax) && (
        <div className="mt-2 flex items-center justify-between text-[11px] text-steel">
          <span>
            {balanceLabel} <span className="text-ash">{balance ?? "—"}</span>
          </span>
          {onMax && (
            <button onClick={onMax} className="uppercase tracking-[0.18em] text-steel transition-colors hover:text-frontier">
              Max
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function Row({ label, hint, value, sub, strong, className }: { label: React.ReactNode; hint?: React.ReactNode; value: React.ReactNode; sub?: React.ReactNode; strong?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-4 py-1.5 text-xs", className)}>
      <span className="flex items-center gap-1.5 text-steel">
        {label}
        {hint && <InfoTip>{hint}</InfoTip>}
      </span>
      <span className={cn("text-right", strong ? "text-ghost" : "text-ash")}>
        {value}
        {sub && <span className="block text-[10px] text-steel">{sub}</span>}
      </span>
    </div>
  );
}
