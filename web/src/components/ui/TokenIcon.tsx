import Image from "next/image";
import { cn } from "@/lib/cn";

const ICONS: Record<string, string> = {
  "T-OpenAI": "/markets/t-openai.svg",
  "T-SpaceX": "/markets/t-spacex.svg",
  "T-Kalshi": "/markets/t-kalshi.svg",
  FRNT: "/tokens/frnt.png",
  dUSDC: "/markets/usdc.png",
  USDC: "/markets/usdc.png",
};

/** Official market icon for a token symbol (Tessera T-Tokens, FRNT, USDC). */
export function TokenIcon({ symbol, size = 20, className }: { symbol: string; size?: number; className?: string }) {
  const src = ICONS[symbol];
  if (!src) return <span className={cn("inline-block shrink-0 rounded-full bg-graphite", className)} style={{ width: size, height: size }} />;
  return (
    <Image
      src={src}
      alt={symbol}
      width={size}
      height={size}
      unoptimized
      className={cn("shrink-0 select-none", symbol === "FRNT" && "rounded-[28%]", className)}
      style={{ width: size, height: size }}
    />
  );
}
