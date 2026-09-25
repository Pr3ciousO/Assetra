import { cn } from "@/lib/cn";

/** Soft Frontier Green radial glow. Use sparingly: hero, NAV, primary CTA. */
export function RadialGlow({ className, intensity = 0.14 }: { className?: string; intensity?: number }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute", className)}
      style={{
        background: `radial-gradient(closest-side, rgb(10 245 0 / ${intensity}), rgb(10 245 0 / ${intensity * 0.3}) 45%, transparent 100%)`,
        filter: "blur(10px)",
      }}
    />
  );
}
