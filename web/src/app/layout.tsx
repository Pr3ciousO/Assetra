import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Grain } from "@/components/ui/Grain";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { SmoothScroll } from "@/components/ui/SmoothScroll";
import "./globals.css";
import { Providers } from "./providers";

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["200", "300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Assetra — Own the frontier", template: "%s · Assetra" },
  description:
    "The Frontier Index: one token, fully backed by Tessera pre-IPO T-Tokens (OpenAI, SpaceX, Kalshi). Invest once or on autopilot. Redeem any time. Built on Solana.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
};

export const viewport: Viewport = { themeColor: "#000000", colorScheme: "dark" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={mono.variable}>
      <body className="min-h-dvh bg-void text-ghost antialiased">
        <Providers>
          <SmoothScroll />
          <ScrollProgress />
          <Grain />
          <Header />
          <main className="relative z-10">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
