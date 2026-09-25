"use client";

import { TokenIcon } from "@/components/ui/TokenIcon";
import { useTessera } from "@/hooks/useData";
import { int, usd, usdCompact } from "@/lib/format";

/** Live Tessera tape. */
export function Ticker() {
  const { data } = useTessera();
  const items = data ?? [];
  const row = (
    <div className="flex shrink-0 items-center gap-12 pr-12">
      {items.map((t) => (
        <span key={t.id} className="flex items-center gap-4 whitespace-nowrap text-[11px] uppercase tracking-[0.18em]">
          <TokenIcon symbol={t.id} size={18} />
          <span className="text-ghost">{t.id}</span>
          <span className="text-frontier">{usd(t.markPrice)}</span>
          <span className="text-steel">Val {usdCompact(t.markValuation)}</span>
          <span className="text-steel">{int(t.holders)} holders</span>
        </span>
      ))}
    </div>
  );
  return (
    <div className="relative overflow-hidden bg-[linear-gradient(180deg,rgb(255_255_255/0.035),rgb(255_255_255/0.01))] py-4 shadow-[inset_0_1px_0_rgb(255_255_255/0.05)] backdrop-blur-xl [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
      {items.length > 0 ? (
        <div className="flex w-max animate-marquee">
          {row}
          {row}
          {row}
          {row}
        </div>
      ) : (
        <div className="h-4" />
      )}
    </div>
  );
}
