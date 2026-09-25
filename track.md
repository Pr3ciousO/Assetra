# Assetra — Build Tracker

Frontier Index (FRNT): a pre-IPO index backed by Tessera T-Tokens, with on-chain Auto-Invest.
Stocklana main track + Tessera bounty · **Solana devnet** · Product spec: [product-prd.md](product-prd.md)

Legend: `[ ]` todo · `[~]` in progress · `[x]` done · `[!]` blocked

---

## Architecture

```text
┌──────────────────────── web (Next.js) ────────────────────────┐
│ Landing · Index · Invest · Auto-Invest · Portfolio · Faucet   │
│ wallet-adapter ─ Anchor client (sdk) ─ /api/tessera, /api/nav │
└────────┬──────────────────────────────────┬───────────────────┘
         │ txs                              │ reads
┌────────▼─────────────┐   CPI   ┌──────────▼──────────┐
│ assetra (Anchor)     │────────▶│ demo_desk (Anchor)  │  devnet only
│ index vault · FRNT   │         │ price feeds · sells │  (swap stand-in)
│ mint/redeem · plans  │         │ demo T-Tokens/dUSDC │
└────────▲─────────────┘         └──────────▲──────────┘
         │ execute_plan                     │ update_price
┌────────┴──────────────────────────────────┴──────────┐
│ keeper (Node): Tessera prices → feeds, runs due      │
│ plans, writes NAV snapshots → Upstash Redis          │
└──────────────────────────────────────────────────────┘
```

**Key design decisions**
- **In-kind vault:** mint and redeem move T-Tokens in and out directly, so solvency never depends on an oracle. Invariant: `vault_i ≥ supply × units_i`.
- **Fixed units per FRNT**, set at a $100 launch NAV with 45/40/15 weights: T-OpenAI 0.055365, T-SpaceX 0.094563, T-Kalshi 0.036249 (per 1 FRNT, from Tessera prices on 2026-09-25; recompute at deploy).
- **Token-2022 transfer fee (20 bps):** on mint, the user sends a grossed-up amount and the program checks the vault balance actually increased by at least `required`. On redeem, the user receives the amount net of Tessera's fee, and the preview shows it.
- **demo_desk** stands in for a DEX on devnet. It sells and buys demo T-Tokens at Tessera mark price (posted by the keeper, with a staleness check) and holds the mint authority for the demo mints. On mainnet it's replaced by keeper-side DEX routing (e.g. Jupiter) plus `mint_in_kind`, behind a `SwapProvider` interface.
- **Demo mints:** T-OpenAI (Demo), T-SpaceX (Demo), T-Kalshi (Demo), all Token-2022 with a 20 bps transfer fee and metadata, plus dUSDC (classic SPL, 6 dp) with an in-app faucet.
- **FRNT** is a classic SPL mint with 9 dp; its mint authority is the index PDA.

**Program accounts (assetra)**
- `Index`: authority, frnt_mint, treasury, mint_fee_bps (30), redeem_fee_bps (30), paused, components[≤5]{t_mint, units, vault}
- `Plan` (PDA: owner + index + id): usdc_per_run, interval_secs, next_run_ts, runs_left, keeper_tip, status. Escrow = a USDC ATA owned by the plan PDA.

**Instructions**
- assetra: `init_index`, `mint_in_kind`, `redeem_in_kind`, `buy_with_usdc` (desk CPI → mint), `create_plan`, `top_up_plan`, `pause_plan`, `resume_plan`, `cancel_plan`, `execute_plan` (permissionless, due check, keeper tip), `set_paused`
- demo_desk: `init_desk`, `init_feed`, `update_price`, `buy`, `sell`, `faucet_usdc`

## Stack
| Layer | Choice |
|---|---|
| Programs | Anchor CLI 1.0.2, Rust 1.98.1, Solana 3.1.10, Token-2022 |
| Web | Next.js 16.3 (App Router, Turbopack), React 19.3, TypeScript, Tailwind v4 |
| Motion | `motion` 13 (`motion/react`, the renamed Framer Motion) + Lenis smooth scroll |
| Icons / font | `@hugeicons/react` + `@hugeicons/core-free-icons` · JetBrains Mono via `next/font` |
| Solana client | `@coral-xyz/anchor` 0.32.1, `@solana/web3.js` 1.x, `@solana/spl-token`, wallet-adapter |
| Data | TanStack Query, Next route handlers, Upstash Redis (NAV snapshots only) |
| UX | sonner (tx toasts with explorer links) |
| Hosting | Vercel (web) · keeper on Railway/Fly (Vercel cron as fallback) |

Monorepo (pnpm): `anchor/` · `sdk/` (IDL types, PDAs, NAV/fee math, SwapProvider) · `web/` · `keeper/`

## Design system (web)
- Tokens: Void `#000000`, Carbon `#050607`, Graphite `#333333`, Steel `#808080`, Ash `#b3b3b3`, Bone `#e8eaee`, Ghost `#ffffff`, Frontier Green `#0af500`
- Global SVG film-grain overlay; glass cards (Carbon at alpha + backdrop blur + Graphite border + inner highlight)
- Radial green glow only behind the hero, NAV and primary CTA
- Scroll progress bar (`useScroll` + `useSpring`), Lenis, section reveals, route transitions, number tickers, drawn-in SVG charts
- Tabular numbers, `prefers-reduced-motion` fallbacks, mobile responsive

---

## Phase 0: Foundations ✅
- [x] pnpm monorepo, root scripts, .gitignore, `wallets/` (gitignored: deployer, keeper, sponsor, program keypair backups)
- [x] Anchor workspace (`assetra` `6GTt…Z6r`, `demo_desk` `H3Mu…dgvf`) + local test harness (`pnpm anchor:test`)
- [x] Next.js 16 app + Tailwind v4 theme tokens + JetBrains Mono + providers (wallet, query, toasts)
- [x] `sdk` package (IDLs synced via `pnpm --filter @assetra/sdk sync-idl`)

## Phase 1: demo_desk program ✅
- [x] Desk + price feed accounts, `update_price` (authority only, staleness)
- [x] `buy` / `buy_exact_out` / `sell` at mark price (mint/burn demo T-Tokens, dUSDC in/out)
- [x] `faucet` (rate-limited per wallet)
- [x] Tests

## Phase 2: assetra program: index vault ✅
- [x] `init_index` (Token-2022 FRNT mint PDA + on-mint metadata, treasury) + `add_component` (vault ATAs) + `set_params` + `set_metadata_uri`
- [x] `mint_in_kind` with transfer-fee gross-up + balance-delta check
- [x] `redeem_in_kind` (burn, pro-rata payout, fees to treasury, works even when paused)
- [x] `buy_with_usdc` (CPI `buy_exact_out` straight into vaults → mint)
- [x] Tests: backing invariant, fee math, rounding, composition lock

## Phase 3: assetra program: Auto-Invest ✅
- [x] `create_plan` / `top_up_plan` / `pause_plan` / `resume_plan` / `cancel_plan` (refund + close)
- [x] `execute_plan`: due check, buy basket, mint FRNT to owner, keeper tip, advance schedule
- [x] Tests: early execution rejected, pause/resume, cancel refund (14/14 passing)

## Phase 4: Devnet deploy + bootstrap ✅
- [x] `anchor/scripts/bootstrap.ts`: mints (Token-2022 + metadata + 20 bps fee), desk, feeds, FRNT, components from live Tessera prices → `sdk/src/deployments/<cluster>.json`. Verified on localnet
- [x] `keeper/scripts/e2e.ts`: faucet → buy → desk buys → mint in kind → redeem → plan (keeper executes) → cancel. Green on localnet, preview == on-chain
- [x] Funded: deployer 10 SOL (user), sponsor 7.41 SOL (moved from VeilAI devnet wallets, 0.05 left in each)
- [x] Both programs deployed to devnet (via Helius RPC)
- [x] Devnet bootstrap (`SITE_URL=https://assetra.vercel.app`; if the final domain differs, update FRNT with `set_metadata_uri`)
- [x] Same e2e on devnet: green, keeper executed the plan run
- [x] Hardening: finalized blockhash in web txs; retries for transient RPC errors in keeper + scripts

## Phase 5: SDK + keeper ✅
- [x] sdk: PDAs, account decoders, NAV/fee/preview math, tx builders (`AssetraClient`)
- [x] Tessera client, with the demo ↔ real mint mapping in the deployment file
- [x] keeper: price push loop (10 min heartbeat), due-plan executor, NAV snapshots → Upstash (key per cluster)

## Phase 6: Web: design system & shell ✅
- [x] Tokens, animated grain overlay, glass wells, corner ticks, radial glow, buttons, inputs, badges, tabs, skeletons
- [x] Lenis + spring scroll progress bar + route transitions (template) + reveal primitives + number tickers
- [x] Header (active-tab glide, network badge, faucet, wallet menu), custom wallet modal, footer, toasts with tx links

## Phase 7: Web: landing page ✅
- [x] Hero (split-word reveal, parallax live NAV card, horizon line), live Tessera ticker, scroll-linked word reveal (problem), composition ring, sticky scroll-rail "How it works", Auto-Invest, proof of reserves, why Solana, final CTA

## Phase 8: Web: app screens ✅
- [x] Index page: NAV hero + drawn-in chart, composition (launch vs live), constituent cards (Tessera data, real + demo mints), proof of reserves
- [x] Invest panel: Buy (exact preview), Mint in kind (with "buy missing T-Tokens"), Redeem (post-fee payouts), success overlay
- [x] Auto-Invest: plan form (1 min demo cadence), schedule preview, plan cards (countdown, pause/resume/top-up/cancel, run history)
- [x] Portfolio: total value, look-through exposure, Auto-Invest summary, on-chain activity feed (parsed events)
- [x] Demo wallet ("Try instantly", in-browser, devnet) + `/api/sponsor` auto-funds SOL for fees (rate-limited via Upstash)

## Phase 9: Polish & QA
- [x] Loading, empty and error states; tx error mapping
- [x] Mobile pass (no horizontal overflow at 390px), reduced-motion CSS fallback
- [x] Headless-Chrome UI e2e on localnet: demo wallet → sponsor → faucet → buy → redeem → plan → keeper run → portfolio
- [x] `next build` + eslint + tsc clean
- [x] Full devnet walkthrough with a fresh demo wallet (headless Chrome): sponsor → faucet → buy → redeem → plan → keeper run

## Phase 10: Submission
- [ ] Vercel deploy (env: `NEXT_PUBLIC_CLUSTER=devnet`, Helius RPC, Upstash, `SPONSOR_SECRET_KEY`) + keeper hosted
- [x] README (architecture, devnet addresses, demo disclosure, open-source components)
- [ ] 90s demo video (script in PRD §14)
- [ ] Submit on Stocklana, tag Tessera bounty

---

## Reference
- Tessera API: `GET https://rest-api.tessera.pe/v1/public/token-details`
- Real mints (mainnet, Token-2022, 9 dp, 20 bps fee): T-OpenAI `oPAiAikWTaFj9RYoRFD35ccfwhnMcB3ThgBZRHSkjTZ` · T-Kalshi `TKLSidmLVt3cqGaaodG8tyRzoANfQwoh67AccjmubeZ` · T-SpaceX `TSPXcLV76s6V2zDiZQ18kBfcbnjaE2ZzNT3ga2Pd99v`
- Devnet (full list in `sdk/src/deployments/devnet.json`):
  - FRNT index `A3rhBYbXtR1sz437bG9KRjFw3FNBERAYBGwGHJYa1QnP` · FRNT mint `DUABAkxwCPcLngb99NJfpuakKVF55Hv5DGuFaba9W41d` · dUSDC `3YqsN6MHibd3FVwuXjtq2yxz6GvgtWtB3JDUXZsvW4Bo`
  - T-OpenAI demo `Fgni3FFDivchwynmRd3vYzfv87ec9HWEcBkAHnwdthuF` · T-SpaceX demo `5WwLrebUquykaq67zDt9cG59kw4vdztuLbAo6QDhrNFW` · T-Kalshi demo `86tQuGiKweywdBRVxVbfmtLvCcPhxqU74pkuTu5AuCXt`

## Log
- 2026-09-25: Devnet live: programs deployed, bootstrapped, SDK e2e + browser e2e green. Devnet keeper running locally (needs hosting).
- 2026-09-25: Web done (Phases 6–9): landing, index, auto-invest, portfolio, demo wallet + sponsor. UI e2e green on localnet. Blocked on devnet SOL for deploy.
- 2026-09-25: Added `set_metadata_uri` ix; SDK, bootstrap, keeper and SDK-driven e2e all green on localnet.
- 2026-09-25: Programs done (Phases 1–3): demo_desk + assetra, 14 integration tests green on a local validator.
- 2026-09-25: The DBC/Meteora route was dropped (T-Tokens' transfer fee is blocked in DBC, and Meteora wants mainnet). Pivoted to the Frontier Index. PRD rewritten, technical PRD removed, tracker created.
