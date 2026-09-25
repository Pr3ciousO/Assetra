import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";
import { InfoTip } from "./InfoTip";

export function Card({ className, hover, ...props }: HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return <div className={cn("glass relative", hover && "glass-hover", className)} {...props} />;
}

export function CardHeader({ label, hint, right, className }: { label: string; hint?: React.ReactNode; right?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between gap-4 px-5 pb-1 pt-5", className)}>
      <span className="flex items-center gap-2">
        <span className="label">{label}</span>
        {hint && <InfoTip>{hint}</InfoTip>}
      </span>
      {right}
    </div>
  );
}
