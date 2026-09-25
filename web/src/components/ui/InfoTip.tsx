"use client";

import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

const WIDTH = 240;
const GAP = 8;

/** Info icon that reveals a short explanation on hover, focus or tap. */
export function InfoTip({ children, className, size = 13 }: { children: React.ReactNode; className?: string; size?: number }) {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number; below: boolean } | null>(null);

  const place = useCallback(() => {
    const r = trigger.current?.getBoundingClientRect();
    if (!r) return;
    const left = Math.min(Math.max(r.left + r.width / 2 - WIDTH / 2, 12), window.innerWidth - WIDTH - 12);
    const below = r.top < 140;
    setPos({ left, top: below ? r.bottom + GAP : r.top - GAP, below });
  }, []);

  const show = () => (place(), setOpen(true));
  const hide = () => !pinned && setOpen(false);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e.type === "pointerdown" && trigger.current?.contains(e.target as Node)) return;
      setOpen(false);
      setPinned(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close(e);
    window.addEventListener("scroll", close, { passive: true, capture: true });
    window.addEventListener("resize", close);
    window.addEventListener("keydown", onKey);
    if (pinned) document.addEventListener("pointerdown", close);
    return () => {
      window.removeEventListener("scroll", close, { capture: true });
      window.removeEventListener("resize", close);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", close);
    };
  }, [open, pinned]);

  return (
    <>
      <button
        ref={trigger}
        type="button"
        aria-label="More info"
        aria-describedby={open ? id : undefined}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (pinned) return (setPinned(false), setOpen(false));
          show();
          setPinned(true);
        }}
        className={cn(
          "inline-grid shrink-0 cursor-help place-items-center align-middle text-steel transition-colors duration-300 hover:text-ghost",
          open && "text-ghost",
          className,
        )}
      >
        <HugeiconsIcon icon={InformationCircleIcon} size={size} strokeWidth={1.6} />
      </button>
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && pos && (
              <motion.div
                id={id}
                role="tooltip"
                initial={{ opacity: 0, y: pos.below ? -4 : 4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: pos.below ? -2 : 2, scale: 0.99 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                style={{ left: pos.left, top: pos.top, width: WIDTH, translateY: pos.below ? 0 : "-100%" }}
                className="pointer-events-none fixed z-[90] rounded-xl bg-[rgb(12_13_14/0.94)] px-3.5 py-3 shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_24px_50px_-18px_rgb(0_0_0/0.95)] backdrop-blur-xl text-left text-[11px] normal-case leading-relaxed tracking-normal text-ash"
              >
                {children}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
