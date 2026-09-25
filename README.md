# Assetra — the Frontier Index

**One token, fully backed by the world's most valuable private companies.**

Assetra is a pre-IPO index protocol on Solana. **FRNT** is backed *in kind* by a fixed basket of [Tessera](https://tessera.pe) T-Tokens: **T-OpenAI 45% · T-SpaceX 40% · T-Kalshi 15%** at a $100 launch NAV. You can buy it with USDC in one signature, set up on-chain recurring buys (**Auto-Invest**), and redeem for the real underlying tokens at any time.

Built for **Stocklana**: main track (*Investing: index baskets, recurring buys*) + **Tessera: Best Use of Pre-IPO stocks**.

> **Demo disclosure.** This build runs on **Solana devnet** with *demo* T-Tokens that mirror Tessera's mainnet mints: Token-2022 with the same 0.20% transfer fee, priced live from Tessera's API. Nothing here is a live mainnet Tessera integration.

---

## Why it matters

- **Access.** Pre-IPO exposure normally takes accredited status and $10K+ minimums. FRNT starts at $1.
- **Diversification.** You get three frontier companies without having to pick winners.
- **Discipline.** Dollar-cost average into private markets 24/7 with on-chain schedules.
- **Trust.** Minting and redeeming happen in kind, so solvency never depends on an oracle. Anyone can verify the backing on-chain, and redemption can't be blocked.

## Try it

1. Open the app and click **Connect → Try instantly**. This creates an in-browser demo wallet that is automatically funded with devnet SOL. You can also use Phantom or Solflare set to devnet.
2. Claim **5,000 dUSDC** from the faucet.
3. **Index → Buy**: invest $250 and watch the preview split across the three T-Tokens.
4. **Auto-Invest**: start a **1 min** plan. The keeper executes the first run within seconds, then one run every minute.
5. **Portfolio**: see your look-through exposure and on-chain activity.
6. **Index → Redeem**: get the underlying T-Tokens back.

## Architecture

```text
web (Next.js 16) ──▶ sdk (AssetraClient, exact preview math) ──▶ assetra program ──CPI──▶ demo_desk program
       │                                                              ▲                        ▲
       └── /api/tessera (cached proxy) · /api/nav · /api/sponsor     │ execute_plan           │ update_price
                                                             keeper (Node): runs due plans, mirrors Tessera prices, NAV snapshots
```

| Package | What it is |
|---|---|
| `anchor/programs/assetra` | Index vault: `init_index`, `add_component`, `mint_in_kind`, `redeem_in_kind`, `buy_with_usdc`, and Auto-Invest plans (`create/top_up/pause/resume/cancel/execute_plan`) |
| `anchor/programs/demo_desk` | **Devnet-only** stand-in DEX: fills buys and sells of demo T-Tokens at the Tessera mark price posted by the keeper, plus a dUSDC faucet |
| `sdk` | Typed client, PDAs, and bigint mirrors of on-chain math (previews match on-chain results exactly) |
| `keeper` | Posts Tessera prices, executes due plans (earning the tip), records NAV history |
| `web` | Next.js 16 · React 19 · Tailwind v4 · Motion · Lenis · Hugeicons · TanStack Query · wallet-adapter |

### Key design decisions
- **Fixed units per FRNT.** Backing invariant: `vault_i ≥ ceil(supply × units_i / 1e9)`. Mint rounds up and redeem rounds down, so rounding always favours the vault.
- **Token-2022 transfer fee.** Tessera's T-Tokens charge 0.20% per transfer. `mint_in_kind` grosses up the deposit and then checks the vault's actual balance change. `redeem_in_kind` payouts show the fee the user will pay.
- **Atomic USDC buys.** `buy_with_usdc` computes NAV from the feeds, buys each leg with an exact-out CPI straight into its vault, and mints FRNT, all in one transaction.
- **Permissionless Auto-Invest.** USDC sits in an escrow owned by the plan PDA. Anyone can call `execute_plan` once it's due and earn the index's keeper tip. Missed slots are skipped rather than replayed in a burst.
- **Mainnet path.** `demo_desk` is the only devnet-specific piece. On mainnet, keeper-side DEX routing (e.g. Jupiter) of the real Tessera mints feeds `mint_in_kind`.

## Run locally

Requires Node 24, pnpm, Rust, Solana CLI 3.1.10 and Anchor 1.0.2.

```bash
pnpm install
pnpm anchor:build                        # build both programs
pnpm anchor:test                         # 14 integration tests on a fresh local validator

# full local stack
pnpm --filter @assetra/anchor localnet   # terminal 1: validator with programs preloaded
solana airdrop 100 -k wallets/deployer.keypair.json --url localhost
CLUSTER=localnet SITE_URL=http://localhost:3000 pnpm --filter @assetra/anchor bootstrap
CLUSTER=localnet pnpm keeper             # terminal 2
echo NEXT_PUBLIC_CLUSTER=localnet > web/.env.local && pnpm dev   # terminal 3
CLUSTER=localnet pnpm --filter @assetra/keeper e2e               # optional scripted end-to-end run
```

`wallets/` (deployer, keeper, sponsor and program keypairs) is gitignored. See `web/.env.example` and `keeper/.env.example` for the environment variables.

## Devnet

| | Address |
|---|---|
| assetra program | `6GTtJo5knveEYPkgHxTdykFtzT4ftwrGBbcGZq8cyZ6r` |
| demo_desk program | `H3Muxe6s3UwdhYCNg7zonSgjCYA3gwmtAiCCJQXcdgvf` |
| FRNT index | `A3rhBYbXtR1sz437bG9KRjFw3FNBERAYBGwGHJYa1QnP` |
| FRNT mint | `DUABAkxwCPcLngb99NJfpuakKVF55Hv5DGuFaba9W41d` |
| dUSDC (demo) | `3YqsN6MHibd3FVwuXjtq2yxz6GvgtWtB3JDUXZsvW4Bo` |
| T-OpenAI (demo) | `Fgni3FFDivchwynmRd3vYzfv87ec9HWEcBkAHnwdthuF` |
| T-SpaceX (demo) | `5WwLrebUquykaq67zDt9cG59kw4vdztuLbAo6QDhrNFW` |
| T-Kalshi (demo) | `86tQuGiKweywdBRVxVbfmtLvCcPhxqU74pkuTu5AuCXt` |
| Everything else | `sdk/src/deployments/devnet.json` |

## Open-source components

Anchor, Solana web3.js / spl-token / wallet-adapter, Next.js, React, Tailwind CSS, Motion, Lenis, Hugeicons (free set), TanStack Query, sonner and Upstash Redis. Prices and token data come from Tessera's public API.
