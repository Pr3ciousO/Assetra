import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export function Footer() {
  return (
    <footer className="relative z-10 mt-32 bg-[linear-gradient(180deg,rgb(255_255_255/0.025),transparent_60%)] shadow-[inset_0_1px_0_rgb(255_255_255/0.05)] backdrop-blur-xl">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr] md:px-8">
        <div className="space-y-4">
          <Logo height={22} />
          <p className="max-w-sm text-xs leading-relaxed text-steel">
            A fully backed pre-IPO index on Solana. Built on Tessera T-Tokens for the Stocklana hackathon.
          </p>
          <p className="max-w-sm text-[11px] leading-relaxed text-steel/80">
            Demo build: runs on Solana devnet with demo T-Tokens that mirror Tessera&apos;s mainnet mints and live mark prices. Not
            investment advice. Nothing here is a live mainnet Tessera integration.
          </p>
        </div>
        <div className="space-y-3 text-xs">
          <p className="label mb-4">Product</p>
          <Link href="/app" className="block text-ash transition-colors hover:text-ghost">Frontier Index</Link>
          <Link href="/auto-invest" className="block text-ash transition-colors hover:text-ghost">Auto-Invest</Link>
          <Link href="/portfolio" className="block text-ash transition-colors hover:text-ghost">Portfolio</Link>
        </div>
        <div className="space-y-3 text-xs">
          <p className="label mb-4">Built with</p>
          <a href="https://tessera.pe" target="_blank" rel="noreferrer" className="block text-ash transition-colors hover:text-ghost">Tessera ↗</a>
          <a href="https://solana.com" target="_blank" rel="noreferrer" className="block text-ash transition-colors hover:text-ghost">Solana ↗</a>
          <a href="https://hackathons.solana.com/hackathons/stocklana" target="_blank" rel="noreferrer" className="block text-ash transition-colors hover:text-ghost">Stocklana ↗</a>
        </div>
      </div>
      <div className="hairline" />
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 text-[10px] uppercase tracking-[0.2em] text-steel md:px-8">
        <span>© 2026 Assetra</span>
        <span>Own the frontier</span>
      </div>
    </footer>
  );
}
