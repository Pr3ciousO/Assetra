import Image from "next/image";
import { cn } from "@/lib/cn";

/** Assetra wordmark (white, transparent background). */
export function Logo({ className, height = 20 }: { className?: string; height?: number }) {
  return (
    <Image
      src="/brand/assetra-logo.png"
      alt="Assetra"
      width={767}
      height={138}
      priority
      className={cn("w-auto select-none", className)}
      style={{ height }}
    />
  );
}
