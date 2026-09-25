use anchor_lang::prelude::*;

#[constant]
pub const DESK_SEED: &[u8] = b"desk";
#[constant]
pub const FEED_SEED: &[u8] = b"feed";
#[constant]
pub const FAUCET_SEED: &[u8] = b"faucet";

/// Quote token decimals. Prices are stored in quote base units (micro-USD) per
/// whole T-Token, so the quote mint must have exactly 6 decimals.
pub const QUOTE_DECIMALS: u8 = 6;
