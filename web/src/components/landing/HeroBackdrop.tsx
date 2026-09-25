/** Fine glass grain: high-frequency turbulence, white on transparent. */
const NOISE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.15' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.6 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E")`;

/**
 * Hero atmosphere: near-black field, a soft Frontier Green glow rising from the
 * bottom centre, frosted with a fine glass grain. Purely decorative, always behind content.
 */
export function HeroBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-[#020303]">
      {/* Wide ambient bloom */}
      <div
        className="absolute bottom-[-46%] left-1/2 h-[82%] w-[130%] max-w-[1800px] animate-breathe rounded-[50%]"
        style={{
          background:
            "radial-gradient(closest-side, rgb(10 245 0 / 0.2), rgb(10 245 0 / 0.08) 40%, rgb(10 245 0 / 0.02) 70%, transparent)",
          filter: "blur(48px)",
        }}
      />
      {/* Warm core at the horizon */}
      <div
        className="absolute bottom-[-10%] left-1/2 h-[22%] w-[44%] -translate-x-1/2 rounded-[50%]"
        style={{ background: "radial-gradient(closest-side, rgb(10 245 0 / 0.26), rgb(10 245 0 / 0.06) 60%, transparent)", filter: "blur(32px)" }}
      />
      {/* Frosted pane: a whisper of light at the top and base edges */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, rgb(255 255 255 / 0.02), transparent 28%, transparent 72%, rgb(255 255 255 / 0.012))" }}
      />
      {/* Glass grain: faint everywhere, richer where the light sits */}
      <div className="absolute inset-0 opacity-[0.045] mix-blend-screen" style={{ backgroundImage: NOISE, backgroundSize: "240px 240px" }} />
      <div
        className="absolute inset-0 opacity-[0.5] mix-blend-overlay [mask-image:radial-gradient(ellipse_65%_55%_at_50%_100%,black,transparent)]"
        style={{ backgroundImage: NOISE, backgroundSize: "240px 240px" }}
      />
      {/* Vignette keeps the edges and header zone near-black */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 110% 85% at 50% 35%, transparent 50%, rgb(0 0 0 / 0.75))" }} />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/70 to-transparent" />
    </div>
  );
}
