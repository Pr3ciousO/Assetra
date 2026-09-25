// Bigint mirrors of the on-chain math, used for exact previews.
import { BPS, INDEX_UNIT, TESSERA_TRANSFER_FEE_BPS } from "./constants";

export interface PricedComponent {
  units: bigint; // base units per 1 whole index token
  decimals: number;
  price: bigint; // micro-USD per whole token
}

const pow10 = (n: number) => 10n ** BigInt(n);
export const ceilDiv = (a: bigint, b: bigint) => (a + b - 1n) / b;
export const feeOf = (amount: bigint, bps: bigint | number) => (amount * BigInt(bps)) / BPS;

export const componentRequired = (indexAmount: bigint, units: bigint) => ceilDiv(indexAmount * units, INDEX_UNIT);
export const componentPayout = (indexAmount: bigint, units: bigint) => (indexAmount * units) / INDEX_UNIT;

/** Token-2022 transfer fee charged on `amount` (fee is rounded up). */
export const transferFee = (amount: bigint, bps = TESSERA_TRANSFER_FEE_BPS) => ceilDiv(amount * bps, BPS);
/** Amount to send so `postFee` arrives after the transfer fee. */
export const preFeeAmount = (postFee: bigint, bps = TESSERA_TRANSFER_FEE_BPS) =>
  bps === 0n || postFee === 0n ? postFee : ceilDiv(postFee * BPS, BPS - bps);

/** NAV of one whole index token, in micro-USD. */
export function navMicro(comps: PricedComponent[]): bigint {
  return comps.reduce((s, c) => s + (c.units * c.price) / pow10(c.decimals), 0n);
}

export interface BuyPreview {
  indexGross: bigint;
  indexNet: bigint;
  fee: bigint;
  spent: bigint;
  legs: { need: bigint; cost: bigint }[];
}

/** Mirrors `BasketBuy::run` + `mint_index_with_fee`. Returns null if the budget is too small. */
export function previewBuy(usdcIn: bigint, comps: PricedComponent[], mintFeeBps: number): BuyPreview | null {
  let navE = 0n;
  let margin = 0n;
  for (const c of comps) {
    const scale = pow10(c.decimals);
    navE += (c.units * c.price * INDEX_UNIT) / scale;
    margin += ceilDiv(c.price, scale) + 1n;
  }
  if (navE === 0n || usdcIn <= margin) return null;
  const indexGross = ((usdcIn - margin) * INDEX_UNIT * INDEX_UNIT) / navE;
  if (indexGross === 0n) return null;
  const legs = comps.map((c) => {
    const need = componentRequired(indexGross, c.units);
    return { need, cost: ceilDiv(need * c.price, pow10(c.decimals)) };
  });
  const spent = legs.reduce((s, l) => s + l.cost, 0n);
  const fee = feeOf(indexGross, mintFeeBps);
  return { indexGross, indexNet: indexGross - fee, fee, spent, legs };
}

export interface MintInKindPreview {
  indexNet: bigint;
  fee: bigint;
  legs: { required: bigint; send: bigint }[];
}

export function previewMintInKind(amount: bigint, comps: Pick<PricedComponent, "units">[], mintFeeBps: number): MintInKindPreview {
  const legs = comps.map((c) => {
    const required = componentRequired(amount, c.units);
    return { required, send: preFeeAmount(required) };
  });
  const fee = feeOf(amount, mintFeeBps);
  return { indexNet: amount - fee, fee, legs };
}

export interface RedeemPreview {
  burned: bigint;
  fee: bigint;
  legs: { payout: bigint; received: bigint }[];
}

export function previewRedeem(amount: bigint, comps: Pick<PricedComponent, "units">[], redeemFeeBps: number): RedeemPreview {
  const fee = feeOf(amount, redeemFeeBps);
  const burned = amount - fee;
  const legs = comps.map((c) => {
    const payout = componentPayout(burned, c.units);
    return { payout, received: payout - transferFee(payout) };
  });
  return { burned, fee, legs };
}

/** Units per whole index token for a target weight at a launch NAV (both in micro-USD). */
export function unitsForWeight(weightBps: number, launchNavMicro: bigint, price: bigint, decimals: number): bigint {
  return (launchNavMicro * BigInt(weightBps) * pow10(decimals)) / (BPS * price);
}

export const toUi = (amount: bigint, decimals: number) => Number(amount) / 10 ** decimals;
export const fromUi = (ui: number | string, decimals: number) => {
  const [w, f = ""] = String(ui).split(".");
  return BigInt(w || "0") * pow10(decimals) + BigInt((f + "0".repeat(decimals)).slice(0, decimals) || "0");
};
