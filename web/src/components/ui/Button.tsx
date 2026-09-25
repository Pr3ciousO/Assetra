"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon } from "@hugeicons/core-free-icons";
import { motion, type HTMLMotionProps } from "motion/react";
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "accent" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-ghost text-void hover:bg-bone shadow-[0_0_0_1px_rgb(255_255_255/0.2),0_10px_30px_-10px_rgb(255_255_255/0.35)] hover:shadow-[0_0_0_1px_rgb(10_245_0/0.5),0_12px_40px_-8px_rgb(10_245_0/0.45)]",
  accent:
    "bg-frontier text-void hover:brightness-110 shadow-[0_0_0_1px_rgb(10_245_0/0.4),0_10px_40px_-8px_rgb(10_245_0/0.55)]",
  secondary:
    "glass-chip text-ghost hover:bg-white/[0.1] hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.12),0_10px_30px_-12px_rgb(10_245_0/0.25)]",
  ghost: "text-ash hover:text-ghost hover:bg-white/[0.05]",
  danger: "bg-danger/[0.1] text-danger shadow-[inset_0_1px_0_rgb(255_77_77/0.15)] hover:bg-danger/[0.16]",
};
const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[11px] gap-1.5",
  md: "h-10 px-4 text-xs gap-2",
  lg: "h-13 px-6 text-sm gap-2.5",
};

export interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading, disabled, children, ...props },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      disabled={disabled || loading}
      className={cn(
        "relative inline-flex select-none items-center rounded-[11px] justify-center font-medium uppercase tracking-[0.14em] transition-[background,box-shadow,border-color,color,filter] duration-300 ease-(--ease-expo) disabled:pointer-events-none disabled:opacity-40",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && <HugeiconsIcon icon={Loading03Icon} size={14} className="animate-spin" />}
      {children as React.ReactNode}
    </motion.button>
  );
});
