import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { PAGES, type PageKey, SITE_URL } from "@/lib/pages";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const ROOT = process.cwd();
const assets = Promise.all([
  readFile(join(ROOT, "src/assets/fonts/JetBrainsMono-Light.ttf")),
  readFile(join(ROOT, "src/assets/fonts/JetBrainsMono-Regular.ttf")),
  readFile(join(ROOT, "src/assets/fonts/JetBrainsMono-Medium.ttf")),
  readFile(join(ROOT, "public/brand/assetra-logo.png")),
]);

/** Film grain, same turbulence as <Grain />, sized to the whole card. */
const NOISE = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='630'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`,
)}`;

export const ogAlt = (key: PageKey) => `${PAGES[key].title}: ${PAGES[key].description}`;

/** Share card: logo top-left, title + description bottom-left, link bottom-right. */
export async function renderOg(key: PageKey) {
  const { path, description, ogTitle } = PAGES[key];
  const [light, regular, medium, logo] = await assets;
  const link = `${SITE_URL.host}${path === "/" ? "" : path}`;

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          display: "flex",
          width: "100%",
          height: "100%",
          backgroundColor: "#000000",
          // Faint Frontier Green glow, top-right
          backgroundImage:
            "radial-gradient(circle at 100% 0%, rgba(10,245,0,0.2) 0%, rgba(10,245,0,0.07) 28%, rgba(10,245,0,0) 58%)",
          fontFamily: "JetBrains Mono",
          color: "#ffffff",
        }}
      >
        {/* Recessed glass well */}
        <div
          style={{
            position: "absolute",
            top: 28,
            left: 28,
            right: 28,
            bottom: 28,
            display: "flex",
            borderRadius: 28,
            border: "1px solid rgba(255,255,255,0.09)",
            backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.01))",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        />

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={NOISE} width={1200} height={630} alt="" style={{ position: "absolute", top: 0, left: 0, opacity: 0.12 }} />

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            padding: "84px 92px 80px",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:image/png;base64,${logo.toString("base64")}`}
            width={767 * (34 / 138)}
            height={34}
            alt="Assetra"
          />

          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 48 }}>
            <div style={{ display: "flex", flexDirection: "column", flexShrink: 1, maxWidth: 700 }}>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  fontSize: 54,
                  fontWeight: 300,
                  lineHeight: 1.12,
                  letterSpacing: "-0.03em",
                }}
              >
                <span style={{ color: "#ffffff" }}>{ogTitle[0]}&nbsp;</span>
                <span style={{ color: "#808080" }}>{ogTitle[1]}</span>
              </div>
              <div style={{ marginTop: 24, fontSize: 21, lineHeight: 1.55, color: "#b3b3b3" }}>{description}</div>
            </div>

            <div
              style={{
                display: "flex",
                flexShrink: 0,
                alignItems: "center",
                gap: 12,
                fontSize: 19,
                fontWeight: 500,
                color: "#e8eaee",
                whiteSpace: "nowrap",
              }}
            >
              <div
                style={{
                  flexShrink: 0,
                  width: 8,
                  height: 8,
                  borderRadius: 8,
                  background: "#0af500",
                  boxShadow: "0 0 12px rgba(10,245,0,0.8)",
                }}
              />
              {link}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "JetBrains Mono", data: light, weight: 300, style: "normal" },
        { name: "JetBrains Mono", data: regular, weight: 400, style: "normal" },
        { name: "JetBrains Mono", data: medium, weight: 500, style: "normal" },
      ],
    },
  );
}
