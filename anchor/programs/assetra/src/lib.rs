pub mod constants;
pub mod error;
pub mod instructions;
pub mod math;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("6GTtJo5knveEYPkgHxTdykFtzT4ftwrGBbcGZq8cyZ6r");

/// Assetra: fully backed, in-kind pre-IPO index tokens (Frontier Index) with
/// on-chain Auto-Invest plans.
#[program]
pub mod assetra {
    use super::*;

    /// Create an index and its Token-2022 index mint (with on-mint metadata).
    #[allow(clippy::too_many_arguments)]
    pub fn init_index(
        ctx: Context<InitIndex>,
        symbol: String,
        name: String,
        uri: String,
        mint_fee_bps: u16,
        redeem_fee_bps: u16,
        keeper_tip: u64,
    ) -> Result<()> {
        instructions::admin::handle_init_index(ctx, symbol, name, uri, mint_fee_bps, redeem_fee_bps, keeper_tip)
    }

    /// Add a constituent: `units` base units backing 1 whole index token.
    /// Only allowed before any index tokens exist.
    pub fn add_component(ctx: Context<AddComponent>, units: u64) -> Result<()> {
        instructions::admin::handle_add_component(ctx, units)
    }

    pub fn set_params(
        ctx: Context<SetParams>,
        mint_fee_bps: u16,
        redeem_fee_bps: u16,
        keeper_tip: u64,
        paused: bool,
    ) -> Result<()> {
        instructions::admin::handle_set_params(ctx, mint_fee_bps, redeem_fee_bps, keeper_tip, paused)
    }

    pub fn set_metadata_uri(ctx: Context<SetMetadataUri>, uri: String) -> Result<()> {
        instructions::admin::handle_set_metadata_uri(ctx, uri)
    }

    pub fn mint_in_kind<'info>(ctx: Context<'info, MintInKind<'info>>, amount: u64) -> Result<()> {
        instructions::in_kind::handle_mint_in_kind(ctx, amount)
    }

    pub fn redeem_in_kind<'info>(ctx: Context<'info, RedeemInKind<'info>>, amount: u64) -> Result<()> {
        instructions::in_kind::handle_redeem_in_kind(ctx, amount)
    }

    pub fn buy_with_usdc<'info>(
        ctx: Context<'info, BuyWithUsdc<'info>>,
        usdc_in: u64,
        min_out: u64,
    ) -> Result<()> {
        instructions::buy::handle_buy_with_usdc(ctx, usdc_in, min_out)
    }

    pub fn create_plan(
        ctx: Context<CreatePlan>,
        id: u64,
        usdc_per_run: u64,
        interval_secs: i64,
        total_runs: u32,
        deposit: u64,
    ) -> Result<()> {
        instructions::plan::handle_create_plan(ctx, id, usdc_per_run, interval_secs, total_runs, deposit)
    }

    pub fn top_up_plan(ctx: Context<TopUpPlan>, amount: u64) -> Result<()> {
        instructions::plan::handle_top_up_plan(ctx, amount)
    }

    pub fn pause_plan(ctx: Context<SetPlanStatus>) -> Result<()> {
        instructions::plan::handle_pause_plan(ctx)
    }

    pub fn resume_plan(ctx: Context<SetPlanStatus>) -> Result<()> {
        instructions::plan::handle_resume_plan(ctx)
    }

    pub fn cancel_plan(ctx: Context<CancelPlan>) -> Result<()> {
        instructions::plan::handle_cancel_plan(ctx)
    }

    pub fn execute_plan<'info>(ctx: Context<'info, ExecutePlan<'info>>) -> Result<()> {
        instructions::plan::handle_execute_plan(ctx)
    }
}
