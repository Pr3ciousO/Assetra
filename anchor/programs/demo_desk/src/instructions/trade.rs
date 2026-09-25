use anchor_lang::prelude::*;
use anchor_spl::token_interface::{burn, mint_to, Burn, Mint, MintTo, TokenAccount, TokenInterface};

use crate::{constants::*, error::DeskError, state::*};

#[event]
pub struct Traded {
    pub trader: Pubkey,
    pub mint: Pubkey,
    pub is_buy: bool,
    pub token_amount: u64,
    pub usdc_amount: u64,
    pub price: u64,
}

#[derive(Accounts)]
pub struct Trade<'info> {
    /// Owner of `buyer_usdc`. May be a PDA signing via CPI (e.g. an Auto-Invest plan).
    pub buyer: Signer<'info>,
    #[account(seeds = [DESK_SEED], bump = desk.bump)]
    pub desk: Account<'info, Desk>,
    #[account(seeds = [FEED_SEED, t_mint.key().as_ref()], bump = feed.bump)]
    pub feed: Account<'info, PriceFeed>,
    #[account(mut, mint::token_program = t_token_program)]
    pub t_mint: InterfaceAccount<'info, Mint>,
    #[account(mut, address = desk.usdc_mint, mint::token_program = usdc_token_program)]
    pub usdc_mint: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        token::mint = usdc_mint,
        token::authority = buyer,
        token::token_program = usdc_token_program,
    )]
    pub buyer_usdc: InterfaceAccount<'info, TokenAccount>,
    /// Receives the T-Tokens. Any owner (e.g. an index vault).
    #[account(mut, token::mint = t_mint, token::token_program = t_token_program)]
    pub recipient: InterfaceAccount<'info, TokenAccount>,
    pub t_token_program: Interface<'info, TokenInterface>,
    pub usdc_token_program: Interface<'info, TokenInterface>,
}

impl<'info> Trade<'info> {
    fn price(&self) -> Result<u64> {
        self.feed
            .fresh_price(self.desk.max_price_age, Clock::get()?.unix_timestamp)
    }

    fn settle(&self, token_amount: u64, usdc_amount: u64, price: u64) -> Result<()> {
        require!(token_amount > 0 && usdc_amount > 0, DeskError::ZeroAmount);
        burn(
            CpiContext::new(
                self.usdc_token_program.key(),
                Burn {
                    mint: self.usdc_mint.to_account_info(),
                    from: self.buyer_usdc.to_account_info(),
                    authority: self.buyer.to_account_info(),
                },
            ),
            usdc_amount,
        )?;
        let seeds: &[&[&[u8]]] = &[&[DESK_SEED, &[self.desk.bump]]];
        mint_to(
            CpiContext::new_with_signer(
                self.t_token_program.key(),
                MintTo {
                    mint: self.t_mint.to_account_info(),
                    to: self.recipient.to_account_info(),
                    authority: self.desk.to_account_info(),
                },
                seeds,
            ),
            token_amount,
        )?;
        emit!(Traded {
            trader: self.buyer.key(),
            mint: self.t_mint.key(),
            is_buy: true,
            token_amount,
            usdc_amount,
            price,
        });
        Ok(())
    }
}

pub fn handle_buy(ctx: Context<Trade>, usdc_in: u64, min_out: u64) -> Result<()> {
    let a = &ctx.accounts;
    let price = a.price()?;
    let out = tokens_for_quote(usdc_in, price, a.t_mint.decimals)?;
    require!(out >= min_out, DeskError::SlippageExceeded);
    a.settle(out, usdc_in, price)
}

pub fn handle_buy_exact_out(ctx: Context<Trade>, amount_out: u64, max_usdc_in: u64) -> Result<()> {
    let a = &ctx.accounts;
    let price = a.price()?;
    let cost = quote_for_tokens_ceil(amount_out, price, a.t_mint.decimals)?;
    require!(cost <= max_usdc_in, DeskError::SlippageExceeded);
    a.settle(amount_out, cost, price)
}

#[derive(Accounts)]
pub struct Sell<'info> {
    pub seller: Signer<'info>,
    #[account(seeds = [DESK_SEED], bump = desk.bump)]
    pub desk: Account<'info, Desk>,
    #[account(seeds = [FEED_SEED, t_mint.key().as_ref()], bump = feed.bump)]
    pub feed: Account<'info, PriceFeed>,
    #[account(mut, mint::token_program = t_token_program)]
    pub t_mint: InterfaceAccount<'info, Mint>,
    #[account(mut, address = desk.usdc_mint, mint::token_program = usdc_token_program)]
    pub usdc_mint: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        token::mint = t_mint,
        token::authority = seller,
        token::token_program = t_token_program,
    )]
    pub seller_t: InterfaceAccount<'info, TokenAccount>,
    #[account(mut, token::mint = usdc_mint, token::token_program = usdc_token_program)]
    pub recipient_usdc: InterfaceAccount<'info, TokenAccount>,
    pub t_token_program: Interface<'info, TokenInterface>,
    pub usdc_token_program: Interface<'info, TokenInterface>,
}

pub fn handle_sell(ctx: Context<Sell>, amount_in: u64, min_usdc_out: u64) -> Result<()> {
    let a = &ctx.accounts;
    let price = a
        .feed
        .fresh_price(a.desk.max_price_age, Clock::get()?.unix_timestamp)?;
    let usdc_out = quote_for_tokens_floor(amount_in, price, a.t_mint.decimals)?;
    require!(amount_in > 0 && usdc_out > 0, DeskError::ZeroAmount);
    require!(usdc_out >= min_usdc_out, DeskError::SlippageExceeded);

    burn(
        CpiContext::new(
            a.t_token_program.key(),
            Burn {
                mint: a.t_mint.to_account_info(),
                from: a.seller_t.to_account_info(),
                authority: a.seller.to_account_info(),
            },
        ),
        amount_in,
    )?;
    let seeds: &[&[&[u8]]] = &[&[DESK_SEED, &[a.desk.bump]]];
    mint_to(
        CpiContext::new_with_signer(
            a.usdc_token_program.key(),
            MintTo {
                mint: a.usdc_mint.to_account_info(),
                to: a.recipient_usdc.to_account_info(),
                authority: a.desk.to_account_info(),
            },
            seeds,
        ),
        usdc_out,
    )?;
    emit!(Traded {
        trader: a.seller.key(),
        mint: a.t_mint.key(),
        is_buy: false,
        token_amount: amount_in,
        usdc_amount: usdc_out,
        price,
    });
    Ok(())
}
