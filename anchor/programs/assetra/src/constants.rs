use anchor_lang::prelude::*;

#[constant]
pub const INDEX_SEED: &[u8] = b"index";
#[constant]
pub const INDEX_MINT_SEED: &[u8] = b"index_mint";
#[constant]
pub const PLAN_SEED: &[u8] = b"plan";

/// Max constituents per index.
pub const MAX_COMPONENTS: usize = 5;
/// Index token decimals. `Component::units` is expressed per 1 whole index token.
pub const INDEX_DECIMALS: u8 = 9;
pub const INDEX_UNIT: u128 = 1_000_000_000;
pub const BPS_DENOM: u64 = 10_000;
/// Mint/redeem fees are capped at 5%.
pub const MAX_FEE_BPS: u16 = 500;
pub const MAX_SYMBOL_LEN: usize = 8;
/// Shortest Auto-Invest cadence (1 minute: demo cadence).
pub const MIN_PLAN_INTERVAL: i64 = 60;
