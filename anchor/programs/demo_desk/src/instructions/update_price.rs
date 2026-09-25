use anchor_lang::prelude::*;

use crate::{constants::*, error::DeskError, instructions::admin::PriceUpdated, state::*};

#[derive(Accounts)]
pub struct UpdatePrice<'info> {
    pub price_authority: Signer<'info>,
    #[account(seeds = [DESK_SEED], bump = desk.bump, has_one = price_authority)]
    pub desk: Account<'info, Desk>,
    #[account(mut, seeds = [FEED_SEED, feed.mint.as_ref()], bump = feed.bump)]
    pub feed: Account<'info, PriceFeed>,
}

pub fn handle_post_price(ctx: Context<UpdatePrice>, price: u64) -> Result<()> {
    require!(price > 0, DeskError::InvalidPrice);
    let now = Clock::get()?.unix_timestamp;
    let feed = &mut ctx.accounts.feed;
    feed.price = price;
    feed.updated_at = now;
    emit!(PriceUpdated { mint: feed.mint, price, updated_at: now });
    Ok(())
}
