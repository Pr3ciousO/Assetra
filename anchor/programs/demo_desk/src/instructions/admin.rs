use anchor_lang::prelude::*;
use anchor_spl::token_interface::Mint;

use crate::{constants::*, error::DeskError, state::*};

#[event]
pub struct PriceUpdated {
    pub mint: Pubkey,
    pub price: u64,
    pub updated_at: i64,
}

#[derive(Accounts)]
pub struct InitDesk<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        init,
        payer = admin,
        space = 8 + Desk::INIT_SPACE,
        seeds = [DESK_SEED],
        bump,
    )]
    pub desk: Account<'info, Desk>,
    #[account(constraint = usdc_mint.decimals == QUOTE_DECIMALS @ DeskError::InvalidQuoteDecimals)]
    pub usdc_mint: InterfaceAccount<'info, Mint>,
    pub system_program: Program<'info, System>,
}

pub fn handle_init_desk(
    ctx: Context<InitDesk>,
    price_authority: Pubkey,
    max_price_age: i64,
    faucet_amount: u64,
    faucet_cooldown: i64,
) -> Result<()> {
    ctx.accounts.desk.set_inner(Desk {
        admin: ctx.accounts.admin.key(),
        price_authority,
        usdc_mint: ctx.accounts.usdc_mint.key(),
        max_price_age,
        faucet_amount,
        faucet_cooldown,
        bump: ctx.bumps.desk,
    });
    Ok(())
}

#[derive(Accounts)]
pub struct SetConfig<'info> {
    pub admin: Signer<'info>,
    #[account(mut, seeds = [DESK_SEED], bump = desk.bump, has_one = admin)]
    pub desk: Account<'info, Desk>,
}

pub fn handle_set_config(
    ctx: Context<SetConfig>,
    price_authority: Pubkey,
    max_price_age: i64,
    faucet_amount: u64,
    faucet_cooldown: i64,
) -> Result<()> {
    let desk = &mut ctx.accounts.desk;
    desk.price_authority = price_authority;
    desk.max_price_age = max_price_age;
    desk.faucet_amount = faucet_amount;
    desk.faucet_cooldown = faucet_cooldown;
    Ok(())
}

#[derive(Accounts)]
pub struct InitFeed<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(seeds = [DESK_SEED], bump = desk.bump, has_one = admin)]
    pub desk: Account<'info, Desk>,
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(
        init,
        payer = admin,
        space = 8 + PriceFeed::INIT_SPACE,
        seeds = [FEED_SEED, mint.key().as_ref()],
        bump,
    )]
    pub feed: Account<'info, PriceFeed>,
    pub system_program: Program<'info, System>,
}

pub fn handle_init_feed(ctx: Context<InitFeed>, price: u64) -> Result<()> {
    require!(price > 0, DeskError::InvalidPrice);
    let now = Clock::get()?.unix_timestamp;
    ctx.accounts.feed.set_inner(PriceFeed {
        mint: ctx.accounts.mint.key(),
        price,
        updated_at: now,
        bump: ctx.bumps.feed,
    });
    emit!(PriceUpdated { mint: ctx.accounts.mint.key(), price, updated_at: now });
    Ok(())
}
