import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Grain } from "@/components/ui/Grain";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { SmoothScroll } from "@/components/ui/SmoothScroll";
import { PAGES, SITE_NAME, SITE_URL, pageMetadata } from "@/lib/pages";
import "./globals.css";
import { Providers } from "./providers";

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["200", "300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  ...pageMetadata("home"),
  title: { default: PAGES.home.title, template: `%s · ${SITE_NAME}` },
  metadataBase: SITE_URL,
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
