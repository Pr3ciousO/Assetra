"use client";

import { GlobalIcon } from "@hugeicons/core-free-icons";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Logo } from "@/components/ui/Logo";
import { FaucetButton } from "@/components/wallet/FaucetButton";
import { WalletButton } from "@/components/wallet/WalletButton";
import { cn } from "@/lib/cn";
import { NETWORK_LABEL } from "@/lib/config";

const NAV = [
  { href: "/app", label: "Index" },
  { href: "/auto-invest", label: "Auto-Invest" },
  { href: "/portfolio", label: "Portfolio" },
];

export function Header() {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 12));

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background,box-shadow,backdrop-filter] duration-500",
        scrolled
          ? "bg-[linear-gradient(180deg,rgb(255_255_255/0.04),rgb(255_255_255/0.01))] shadow-[inset_0_-1px_0_rgb(255_255_255/0.04),0_20px_40px_-30px_rgb(0_0_0/0.9)] backdrop-blur-2xl [background-color:rgb(0_0_0/0.55)]"
          : "",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-5 md:px-8">
        <Link href="/" className="shrink-0 transition-opacity hover:opacity-80" aria-label="Assetra home">
          <Logo height={20} />
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => {
            const active = pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "relative px-3 py-2 text-[11px] uppercase tracking-[0.2em] transition-colors duration-300",
                  active ? "text-ghost" : "text-steel hover:text-ash",
                )}
              >
                {n.label}
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-x-3 -bottom-[1px] h-px bg-frontier shadow-[0_0_8px_rgb(10_245_0/0.9)]"
                    transition={{ type: "spring", stiffness: 400, damping: 34 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2.5">
          <Badge tone="green" icon={GlobalIcon} className="hidden sm:inline-flex">
            {NETWORK_LABEL} · Demo
          </Badge>
          <FaucetButton className="hidden lg:inline-flex" />
          <WalletButton />
        </div>
      </div>
      {/* Mobile nav */}
      <nav className="flex items-center gap-1 overflow-x-auto px-3 md:hidden">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={cn(
              "px-3 py-2.5 text-[10px] uppercase tracking-[0.2em]",
              pathname.startsWith(n.href) ? "text-frontier" : "text-steel",
            )}
          >
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
