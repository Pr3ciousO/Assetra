use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::Token2022,
    token_interface::{Mint, TokenAccount, TokenInterface},
};
use demo_desk::program::DemoDesk;

use crate::{
    constants::*,
    error::AssetraError,
    instructions::basket::{mint_index_with_fee, BasketBuy},
    state::*,
};

#[event]
pub struct IndexBought {
    pub index: Pubkey,
    pub user: Pubkey,
    pub usdc_spent: u64,
    pub amount: u64,
    pub fee: u64,
}

#[derive(Accounts)]
pub struct BuyWithUsdc<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        seeds = [INDEX_SEED, index.symbol.as_bytes()],
        bump = index.bump,
        has_one = index_mint,
        has_one = treasury,
        has_one = usdc_mint,
        has_one = desk,
    )]
    pub index: Box<Account<'info, Index>>,
    #[account(mut)]
    pub index_mint: Box<InterfaceAccount<'info, Mint>>,
    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = index_mint,
        associated_token::authority = user,
        associated_token::token_program = token_program,
    )]
    pub user_index: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(mut)]
    pub treasury: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(mut)]
    pub usdc_mint: Box<InterfaceAccount<'info, Mint>>,
    #[account(
        mut,
        token::mint = usdc_mint,
        token::authority = user,
        token::token_program = usdc_token_program,
    )]
    pub user_usdc: Box<InterfaceAccount<'info, TokenAccount>>,
    /// CHECK: bound by `has_one = desk`; validated by the desk program.
    pub desk: UncheckedAccount<'info>,
    pub desk_program: Program<'info, DemoDesk>,
    pub token_program: Program<'info, Token2022>,
    pub usdc_token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

/// Spend up to `usdc_in` USDC: buy the basket at mark price straight into the
/// vaults and mint the index tokens it backs. Remaining accounts, per
/// component in index order: `[component_mint (mut), vault (mut), price_feed]`.
pub fn handle_buy_with_usdc<'info>(
    ctx: Context<'info, BuyWithUsdc<'info>>,
    usdc_in: u64,
    min_out: u64,
) -> Result<()> {
    let a = &ctx.accounts;
    require!(!a.index.paused, AssetraError::Paused);
    require!(usdc_in > 0, AssetraError::ZeroAmount);

    let (gross, spent) = BasketBuy {
        index: &a.index,
        buyer: a.user.to_account_info(),
        buyer_usdc: a.user_usdc.to_account_info(),
        usdc_mint: a.usdc_mint.to_account_info(),
        desk: a.desk.to_account_info(),
        desk_program: a.desk_program.to_account_info(),
        token_program: a.token_program.to_account_info(),
        usdc_token_program: a.usdc_token_program.to_account_info(),
        remaining: ctx.remaining_accounts,
        buyer_seeds: &[],
    }
    .run(usdc_in)?;

    let (net, fee) = mint_index_with_fee(
        &a.index,
        &a.index_mint.to_account_info(),
        &a.user_index.to_account_info(),
        &a.treasury.to_account_info(),
        &a.index.to_account_info(),
        &a.token_program.to_account_info(),
        gross,
    )?;
    require!(net >= min_out, AssetraError::SlippageExceeded);
    emit!(IndexBought { index: a.index.key(), user: a.user.key(), usdc_spent: spent, amount: net, fee });
    Ok(())
}
