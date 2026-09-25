import type { Metadata } from "next";

export const SITE_NAME = "Assetra";

export const SITE_URL = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"),
);

type PageCopy = {
  path: string;
  /** Browser tab title (the root layout appends " · Assetra"). */
  title: string;
  description: string;
  /** Headline on the share image: lead in white, rest in steel, like the page headers. */
  ogTitle: [lead: string, rest: string];
};

/** One source of truth for each route's title, description and share image copy. */
export const PAGES = {
  home: {
    path: "/",
    title: "Assetra — Own the frontier",
    description:
      "The Frontier Index: one token, fully backed by Tessera pre-IPO T-Tokens (OpenAI, SpaceX, Kalshi). Invest once or on autopilot. Redeem any time. Built on Solana.",
    ogTitle: ["Own the frontier.", "Pre-IPO, indexed."],
  },
  index: {
    path: "/app",
    title: "Frontier Index",
    description:
      "Live NAV, composition and proof of reserves for FRNT. Buy with USDC, mint in kind, or redeem for the underlying T-Tokens at any time.",
    ogTitle: ["The Frontier Index.", "Pre-IPO in one token."],
  },
  autoInvest: {
    path: "/auto-invest",
    title: "Auto-Invest",
    description:
      "Recurring USDC buys into the Frontier Index, enforced on-chain and executed by a permissionless keeper. Pause, top up or cancel any time.",
    ogTitle: ["Build your position", "on autopilot."],
  },
  portfolio: {
    path: "/portfolio",
    title: "Portfolio",
    description:
      "Your FRNT balance, value and P&L, with look-through exposure to OpenAI, SpaceX and Kalshi, plus your Auto-Invest plans and activity.",
    ogTitle: ["Your slice", "of the frontier."],
  },
} satisfies Record<string, PageCopy>;

export type PageKey = keyof typeof PAGES;

/** Page metadata with matching Open Graph / Twitter text. The image comes from the route's opengraph-image. */
export function pageMetadata(key: PageKey): Metadata {
  const { path, title, description } = PAGES[key];
  const shareTitle = key === "home" ? title : `${title} · ${SITE_NAME}`;
  return {
    title: key === "home" ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", siteName: SITE_NAME, url: path, title: shareTitle, description },
    twitter: { card: "summary_large_image", title: shareTitle, description },
  };
}
