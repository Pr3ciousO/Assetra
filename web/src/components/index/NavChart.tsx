"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { usd } from "@/lib/format";
import type { NavPoint } from "@/hooks/useData";

const PAD = { t: 18, r: 12, b: 26, l: 12 };

export function NavChart({ points, height = 240 }: { points: NavPoint[]; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  const geo = useMemo(() => {
    if (points.length < 2) return null;
    const t0 = points[0].t;
    const t1 = points[points.length - 1].t;
    const vals = points.map((p) => p.nav);
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    const span = Math.max(hi - lo, hi * 0.004);
    const yMin = lo - span * 0.25;
    const yMax = hi + span * 0.25;
    const x = (t: number) => PAD.l + ((t - t0) / Math.max(t1 - t0, 1)) * (width - PAD.l - PAD.r);
    const y = (v: number) => PAD.t + (1 - (v - yMin) / (yMax - yMin)) * (height - PAD.t - PAD.b);
    const xy = points.map((p) => [x(p.t), y(p.nav)] as const);
    const line = xy.map(([a, b], i) => `${i ? "L" : "M"}${a.toFixed(1)},${b.toFixed(1)}`).join(" ");
    const area = `${line} L${xy[xy.length - 1][0].toFixed(1)},${height - PAD.b} L${xy[0][0].toFixed(1)},${height - PAD.b} Z`;
    const ticks = (width < 480 ? [0, 1] : [0, 0.5, 1]).map((f) => ({ x: PAD.l + f * (width - PAD.l - PAD.r), t: t0 + f * (t1 - t0) }));
    return { xy, line, area, ticks };
  }, [points, width, height]);

  const onMove = (e: React.PointerEvent) => {
    if (!geo) return;
    const rect = ref.current!.getBoundingClientRect();
    const px = e.clientX - rect.left;
    let best = 0;
    for (let i = 1; i < geo.xy.length; i++) if (Math.abs(geo.xy[i][0] - px) < Math.abs(geo.xy[best][0] - px)) best = i;
    setHover(best);
  };

  const fmtTime = (t: number) =>
    new Date(t).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div ref={ref} className="relative w-full select-none" style={{ height }} onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
      {geo ? (
        <svg width={width} height={height} className="overflow-visible">
          <defs>
            <linearGradient id="nav-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#0af500" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#0af500" stopOpacity="0" />
            </linearGradient>
            <filter id="nav-glow" filterUnits="userSpaceOnUse" x={0} y={0} width={width} height={height}>
              <feGaussianBlur stdDeviation="4" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1={PAD.l} x2={width - PAD.r} y1={PAD.t + f * (height - PAD.t - PAD.b)} y2={PAD.t + f * (height - PAD.t - PAD.b)} stroke="rgb(255 255 255 / 0.07)" strokeDasharray="2 6" />
          ))}
          <motion.path d={geo.area} fill="url(#nav-fill)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: 0.4 }} />
          <motion.path
            d={geo.line}
            fill="none"
            stroke="#0af500"
            strokeWidth={1.5}
            filter="url(#nav-glow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
          />
          <circle cx={geo.xy[geo.xy.length - 1][0]} cy={geo.xy[geo.xy.length - 1][1]} r={3} fill="#0af500">
            <animate attributeName="r" values="3;6;3" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
          </circle>
          {geo.ticks.map((tk, i) => (
            <text key={i} x={tk.x} y={height - 6} fill="#808080" fontSize="10" textAnchor={i === 0 ? "start" : i === geo.ticks.length - 1 ? "end" : "middle"} letterSpacing="0.08em">
              {fmtTime(tk.t)}
            </text>
          ))}
          {hover !== null && (
            <g>
              <line x1={geo.xy[hover][0]} x2={geo.xy[hover][0]} y1={PAD.t} y2={height - PAD.b} stroke="#808080" strokeDasharray="3 3" />
              <circle cx={geo.xy[hover][0]} cy={geo.xy[hover][1]} r={4} fill="#000" stroke="#0af500" strokeWidth={1.5} />
            </g>
          )}
        </svg>
      ) : (
        <div className="grid h-full place-items-center text-xs text-steel">NAV history begins at launch</div>
      )}
      <AnimatePresence>
        {geo && hover !== null && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass pointer-events-none absolute top-0 px-3 py-2 text-[11px]"
            style={{ left: Math.min(Math.max(geo.xy[hover][0] - 70, 0), width - 150) }}
          >
            <div className="text-ghost">{usd(points[hover].nav)}</div>
            <div className="text-steel">{fmtTime(points[hover].t)}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
