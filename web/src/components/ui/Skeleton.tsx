import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block animate-pulse rounded-md bg-gradient-to-r from-graphite/40 via-graphite/70 to-graphite/40",
        className,
      )}
    />
  );
}
