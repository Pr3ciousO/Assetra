use anchor_lang::prelude::*;

#[error_code]
pub enum DeskError {
    #[msg("Quote mint must have 6 decimals")]
    InvalidQuoteDecimals,
    #[msg("Price must be greater than zero")]
    InvalidPrice,
    #[msg("Price feed is stale")]
    StalePrice,
    #[msg("Amount must be greater than zero")]
    ZeroAmount,
    #[msg("Output below minimum (slippage)")]
    SlippageExceeded,
    #[msg("Faucet cooldown has not elapsed")]
    FaucetCooldown,
    #[msg("Arithmetic overflow")]
    MathOverflow,
}
