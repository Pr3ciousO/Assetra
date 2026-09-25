# ASSETRA — Product PRD

> **Own the frontier. One token, the world's most valuable private companies.**

Assetra is a pre-IPO index protocol on Solana. Its first product, the **Frontier Index (FRNT)**, is a single token fully backed by Tessera T-Tokens (T-OpenAI, T-SpaceX, T-Kalshi). Buy it once or on autopilot, and redeem it for the underlying tokens at any time.

Built for **Stocklana**. It targets the main track (*Investing: index baskets, recurring buys*) and the **Tessera, Best Use of Pre-IPO stocks** bounty.

---

## 1. Problem

The biggest wealth creation now happens **before the IPO**, and ordinary investors are locked out.

- **Access:** pre-IPO exposure normally takes accredited status, SPV paperwork and $10K–$100K minimums.
- **Concentration:** Tessera removes the access barrier, but buying T-Tokens one by one means picking winners, tracking several positions and rebalancing by hand.
- **Discipline:** there's no easy way to build a pre-IPO position gradually. Most people buy once at whatever price they happen to see.

## 2. Solution

Assetra gives you the **index fund experience for private markets**:

1. **One token, diversified.** FRNT holds a fixed basket of T-Tokens, so one buy gets you exposure to OpenAI, SpaceX and Kalshi.
2. **Auto-Invest.** Set $X per week in USDC. Plans are enforced on-chain and executed permissionlessly. Dollar-cost averaging into private markets, 24/7.
3. **Fully backed, always redeemable.** Every FRNT is backed by T-Tokens held in an on-chain vault. You can burn FRNT and receive your share of the underlying tokens at any time, with no permission needed and no waiting period.

## 3. Users

| User | Need | Assetra gives them |
|---|---|---|
| **Retail investor** | "I want OpenAI/SpaceX upside but can't pick or afford them all." | One diversified token from $1 |
| **Long-term saver** | "I want to build a position every week without thinking." | On-chain Auto-Invest plans |
| **Crypto-native holder** | "I want private-market exposure I can use in DeFi." | A standard SPL token, composable anywhere |

---

## 4. The Frontier Index (FRNT)

### Composition

FRNT is defined by **fixed units** of each T-Token per 1 FRNT. It launches at **$100 NAV**, using these target weights:

| Component | Sector | Launch weight |
|---|---|---|
| T-OpenAI | Artificial Intelligence | 45% |
| T-SpaceX | Aerospace | 40% |
| T-Kalshi | Prediction Markets | 15% |

**Why capped weights?** Pure market-cap weighting would give Kalshi (~$14B) less than 1% next to OpenAI (~$950B) and SpaceX (~$800B). Capped weights keep the index diversified across sectors.

### NAV

`NAV = Σ (units_i × Tessera mark price_i)`, with prices read live from the Tessera API. Weights drift with prices, like any real index, and the app shows both **launch weights** and **live weights**.

### Why in-kind backing matters

Minting and redeeming happen **in kind** (T-Tokens in, FRNT out, and back). The vault therefore never depends on a price oracle to stay solvent. Backing is exactly verifiable on-chain, and the app shows it on the index page as **proof of reserves**.

### Rebalancing

The composition is fixed for the MVP. Scheduled rebalancing and new constituents (e.g. T-Anthropic when available) are on the roadmap.

---

## 5. Features (MVP)

### 5.1 Invest
- Enter a USDC amount and see a **live preview**: FRNT received, how the money splits across each T-Token, fees and NAV.
- One signature does the whole thing: buy the underlying tokens, deposit them into the vault and mint FRNT.

### 5.2 Mint & redeem in kind
- **Mint:** deposit the exact basket of T-Tokens and receive FRNT (for users who already hold T-Tokens).
- **Redeem:** burn FRNT and receive the underlying T-Tokens, with the payout shown before signing.

### 5.3 Auto-Invest
- Create a plan: amount per run, frequency (daily / weekly / monthly) and number of runs (or ongoing).
- Plan funds sit in a per-user on-chain escrow. Anyone can execute a run once it's due, and a small keeper tip pays for execution.
- Pause, top up or cancel at any time. Cancelling refunds the remaining USDC.
- A timeline shows past runs (with transaction links) and the next scheduled run.

### 5.4 Portfolio
- FRNT balance, current value, cost basis and P&L.
- Look-through exposure: "You own $X of OpenAI, $Y of SpaceX, $Z of Kalshi."
- Active Auto-Invest plans and activity history.

### 5.5 Index page
- Live NAV with change, and a NAV history chart (recorded since Assetra's launch).
- Composition with launch vs live weights.
- **Proof of reserves:** vault balances vs FRNT supply, with explorer links.
- Per-constituent cards with price, valuation, holders and sector, all from Tessera.

### 5.6 Landing page
- A story-driven, scroll-animated page: problem → index → auto-invest → proof of reserves → CTA.

---

## 6. Core flows

```text
Invest:       Connect wallet → enter USDC → preview → sign → FRNT in wallet
Auto-Invest:  Choose amount + frequency → fund escrow → sign → runs execute automatically
Redeem:       Enter FRNT → preview T-Token payout → sign → T-Tokens in wallet
```

---

## 7. Fees & revenue

| Fee | Rate | Notes |
|---|---|---|
| Mint fee | 0.30% | Paid in FRNT to the treasury |
| Redeem fee | 0.30% | Paid in FRNT to the treasury |
| Auto-Invest keeper tip | small fixed USDC | Pays whoever executes the run |
| Management fee | 0% at launch | Possible later: streaming fee |

Tessera's own 0.20% T-Token transfer fee is passed through and **shown explicitly** in every preview. No hidden costs.

---

## 8. Trust & transparency

- **Fully backed:** FRNT supply is always ≤ vault holdings ÷ units. Anyone can verify this on-chain.
- **Exit anytime:** in-kind redemption can't be blocked by Assetra.
- **Honest demo:** the hackathon build runs on **Solana devnet** with **demo T-Tokens** that copy the real ones (Token-2022, 0.20% transfer fee). Prices come live from the Tessera API. Every demo asset is clearly labelled **Demo**, and nothing is presented as a live mainnet Tessera integration.
- **Mainnet-ready:** the demo swap venue is behind one interface, so real T-Token mints and DEX routing can replace it at launch.

---

## 9. Why Solana

- **Fractional and cheap:** buying $5 of a $100 index across three assets is only viable with sub-cent fees.
- **24/7 recurring buys:** on-chain schedules with permissionless execution, with no broker and no market hours.
- **Composable:** FRNT is a standard SPL token, ready for DEX pools, lending and payments.
- **The assets are here:** Tessera T-Tokens are Solana-native.

---

## 10. Hackathon fit

| Judging question | Assetra's answer |
|---|---|
| Real user and problem? | Retail investors locked out of pre-IPO markets who don't want to pick winners |
| Working end-to-end demo? | Faucet → invest → Auto-Invest runs → portfolio → redeem, all on-chain |
| Why Solana? | Micro-sized recurring buys and composable, Solana-native T-Tokens |
| Quality of execution? | Real on-chain vault and scheduler, live Tessera data, polished UI |
| **Tessera bounty** | Uses T-OpenAI and T-Kalshi; every FRNT locks real T-Token demand |

---

## 11. Design direction

**Feel:** a private-markets terminal. Dark, precise, calm, confident. Monospaced type, recessed glass wells, film-grain texture, and one electric accent.

### Palette
| Token | Hex | Role |
|---|---|---|
| Void Black | `#000000` | Canvas, hero, stage for every screen |
| Carbon Card | `#050607` | Cards: recessed wells, not raised panels |
| Graphite | `#333333` | Deep borders, heavy separators |
| Steel Gray | `#808080` | Borders, dividers, icon strokes, disabled text |
| Ash Gray | `#b3b3b3` | Secondary text, table content, helper copy |
| Bone White | `#e8eaee` | Sparing tonal washes |
| Ghost White | `#ffffff` | Primary text, primary buttons |
| **Frontier Green** | `#0af500` | Brand accent: progress, positive deltas, focus, key highlights. Used sparingly. |

### Type
- **JetBrains Mono** everywhere. Tabular numbers for all figures.
- Tight uppercase labels with wide tracking, and large light-weight numerals for NAV and values.

### Surfaces & texture
- Global **gritty film-grain overlay** (SVG noise) over the Void Black canvas.
- **Glassmorphism:** translucent Carbon cards with backdrop blur, 1px Graphite borders and a faint inner highlight.
- **Radial gradients only where they earn it:** a soft green glow behind the hero, the NAV figure and the primary CTA. Nowhere else.

### Motion
- **Scroll-driven progress bar** in Frontier Green at the top of the viewport, spring-smoothed.
- Smooth scrolling with inertia, and section reveals (fade + rise + blur-in) as you scroll.
- Smooth page transitions between routes.
- Counting number tickers for NAV, balances and P&L; chart lines that draw in; hover glows on cards.
- Micro-interactions on every button and input. Respects `prefers-reduced-motion`.

### Icons
- Hugeicons, stroke style, in Steel Gray with Ghost White or green on active.

---

## 12. Out of scope (MVP)

Lending and leverage, governance/DAO, custom user-built indexes, rebalancing, mobile apps, multiple chains, fiat on-ramp, payments/subscriptions.

## 13. Roadmap (after the hackathon)

1. Mainnet: real T-Token mints with DEX routing (e.g. Jupiter).
2. More indexes (AI-only, Frontier Tech) as Tessera lists new T-Tokens.
3. Scheduled rebalancing with transparent rules.
4. FRNT liquidity pools and use as lending collateral.
5. Pay-from-portfolio and gifting ("send someone $20 of the frontier").

---

## 14. 90-second demo

| Time | Beat |
|---|---|
| 0:00 | Landing: "The best companies don't IPO anymore until it's too late." |
| 0:15 | Index page: live NAV, composition, proof of reserves |
| 0:30 | Invest $250 USDC → preview split → sign → FRNT arrives |
| 0:50 | Auto-Invest: $25 weekly → sign → a run executes on-chain |
| 1:05 | Portfolio: look-through exposure to OpenAI, SpaceX, Kalshi |
| 1:15 | Redeem FRNT → T-Tokens back in the wallet |
| 1:25 | "Pre-IPO investing, indexed, automated and fully backed. Built on Tessera, on Solana." |

## 15. Success in 30 seconds

> "I put in USDC." → "I own a slice of OpenAI, SpaceX and Kalshi." → "It keeps buying for me every week." → "I can redeem for the real tokens at any time."
