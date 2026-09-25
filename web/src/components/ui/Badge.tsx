import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { cn } from "@/lib/cn";

export function Badge({ children, tone = "neutral", icon, pulse, className }: {
  children: React.ReactNode;
  tone?: "neutral" | "green" | "warn";
  icon?: IconSvgElement;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] uppercase leading-none tracking-[0.18em]",
        tone === "neutral" && "glass-chip text-ash",
        tone === "green" && "bg-frontier/[0.08] text-frontier shadow-[inset_0_1px_0_rgb(10_245_0/0.14)] backdrop-blur-md",
        tone === "warn" && "bg-yellow-400/[0.08] text-yellow-300 shadow-[inset_0_1px_0_rgb(250_204_21/0.14)] backdrop-blur-md",
        className,
      )}
    >
      {icon && <HugeiconsIcon icon={icon} size={12} strokeWidth={1.8} className={cn(pulse && "animate-pulse")} />}
      {children}
    </span>
  );
}
