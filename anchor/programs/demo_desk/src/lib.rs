pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("H3Muxe6s3UwdhYCNg7zonSgjCYA3gwmtAiCCJQXcdgvf");

/// Assetra demo desk (DEVNET ONLY).
///
/// Stands in for a DEX so the Frontier Index can be demoed end-to-end on
/// devnet. It fills buys and sells of demo T-Tokens against dUSDC at the
/// Tessera mark price posted by the keeper, by minting and burning (the desk
/// PDA is the mint authority of every demo mint). On mainnet this is replaced
/// by real DEX routing of the real Tessera mints.
#[program]
pub mod demo_desk {
    use super::*;

    pub fn init_desk(
        ctx: Context<InitDesk>,
        price_authority: Pubkey,
        max_price_age: i64,
        faucet_amount: u64,
        faucet_cooldown: i64,
    ) -> Result<()> {
        instructions::admin::handle_init_desk(ctx, price_authority, max_price_age, faucet_amount, faucet_cooldown)
    }

    pub fn set_config(
        ctx: Context<SetConfig>,
        price_authority: Pubkey,
        max_price_age: i64,
        faucet_amount: u64,
        faucet_cooldown: i64,
    ) -> Result<()> {
        instructions::admin::handle_set_config(ctx, price_authority, max_price_age, faucet_amount, faucet_cooldown)
    }

    pub fn init_feed(ctx: Context<InitFeed>, price: u64) -> Result<()> {
        instructions::admin::handle_init_feed(ctx, price)
    }

    /// Keeper posts the latest Tessera mark price (micro-USD per whole token).
    pub fn update_price(ctx: Context<UpdatePrice>, price: u64) -> Result<()> {
        instructions::update_price::handle_post_price(ctx, price)
    }

    /// Spend exactly `usdc_in` dUSDC; receive at least `min_out` T-Tokens.
    pub fn buy(ctx: Context<Trade>, usdc_in: u64, min_out: u64) -> Result<()> {
        instructions::trade::handle_buy(ctx, usdc_in, min_out)
    }

    /// Receive exactly `amount_out` T-Tokens; spend at most `max_usdc_in` dUSDC.
    pub fn buy_exact_out(ctx: Context<Trade>, amount_out: u64, max_usdc_in: u64) -> Result<()> {
        instructions::trade::handle_buy_exact_out(ctx, amount_out, max_usdc_in)
    }

    /// Sell exactly `amount_in` T-Tokens; receive at least `min_usdc_out` dUSDC.
    pub fn sell(ctx: Context<Sell>, amount_in: u64, min_usdc_out: u64) -> Result<()> {
        instructions::trade::handle_sell(ctx, amount_in, min_usdc_out)
    }

    /// Rate-limited dUSDC faucet for demo wallets.
    pub fn faucet(ctx: Context<Faucet>) -> Result<()> {
        instructions::faucet::handle_claim_faucet(ctx)
    }
}
