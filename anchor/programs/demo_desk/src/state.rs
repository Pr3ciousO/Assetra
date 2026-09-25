use anchor_lang::prelude::*;

use crate::error::DeskError;

/// Global desk config. The desk PDA is the mint authority of every demo mint
/// (demo T-Tokens and dUSDC), so it can "fill" buys and sells at mark price
/// without holding inventory.
#[account]
#[derive(InitSpace)]
pub struct Desk {
    pub admin: Pubkey,
    /// Signer allowed to post prices (the keeper).
    pub price_authority: Pubkey,
    /// Demo USDC mint (6 decimals).
    pub usdc_mint: Pubkey,
    /// Max age of a price, in seconds, before trades are rejected.
    pub max_price_age: i64,
    /// dUSDC base units minted per faucet claim.
    pub faucet_amount: u64,
    /// Seconds between faucet claims per wallet.
    pub faucet_cooldown: i64,
    pub bump: u8,
}

/// Mark price for one demo T-Token, mirrored from the Tessera API.
#[account]
#[derive(InitSpace)]
pub struct PriceFeed {
    pub mint: Pubkey,
    /// Micro-USD (quote base units) per whole token.
    pub price: u64,
    pub updated_at: i64,
    pub bump: u8,
}

impl PriceFeed {
    pub fn fresh_price(&self, max_age: i64, now: i64) -> Result<u64> {
        require!(self.price > 0, DeskError::InvalidPrice);
        require!(
            now.saturating_sub(self.updated_at) <= max_age,
            DeskError::StalePrice
        );
        Ok(self.price)
    }
}

#[account]
#[derive(InitSpace)]
pub struct FaucetClaim {
    pub user: Pubkey,
    pub last_claim: i64,
    pub bump: u8,
}

/// Token base units received for `quote_in` micro-USD (rounds down).
pub fn tokens_for_quote(quote_in: u64, price: u64, decimals: u8) -> Result<u64> {
    let out = (quote_in as u128)
        .checked_mul(10u128.pow(decimals as u32))
        .ok_or(DeskError::MathOverflow)?
        / price as u128;
    u64::try_from(out).map_err(|_| DeskError::MathOverflow.into())
}

/// Micro-USD cost of `amount` token base units (rounds up).
pub fn quote_for_tokens_ceil(amount: u64, price: u64, decimals: u8) -> Result<u64> {
    let scale = 10u128.pow(decimals as u32);
    let num = (amount as u128)
        .checked_mul(price as u128)
        .ok_or(DeskError::MathOverflow)?;
    u64::try_from(num.div_ceil(scale)).map_err(|_| DeskError::MathOverflow.into())
}

/// Micro-USD proceeds for selling `amount` token base units (rounds down).
pub fn quote_for_tokens_floor(amount: u64, price: u64, decimals: u8) -> Result<u64> {
    let num = (amount as u128)
        .checked_mul(price as u128)
        .ok_or(DeskError::MathOverflow)?;
    u64::try_from(num / 10u128.pow(decimals as u32)).map_err(|_| DeskError::MathOverflow.into())
}
