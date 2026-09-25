use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{mint_to, Mint, MintTo, TokenAccount, TokenInterface},
};

use crate::{constants::*, error::DeskError, state::*};

#[event]
pub struct FaucetClaimed {
    pub user: Pubkey,
    pub amount: u64,
}

#[derive(Accounts)]
pub struct Faucet<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(seeds = [DESK_SEED], bump = desk.bump)]
    pub desk: Account<'info, Desk>,
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + FaucetClaim::INIT_SPACE,
        seeds = [FAUCET_SEED, user.key().as_ref()],
        bump,
    )]
    pub claim: Account<'info, FaucetClaim>,
    #[account(mut, address = desk.usdc_mint, mint::token_program = usdc_token_program)]
    pub usdc_mint: InterfaceAccount<'info, Mint>,
    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = usdc_mint,
        associated_token::authority = user,
        associated_token::token_program = usdc_token_program,
    )]
    pub user_usdc: InterfaceAccount<'info, TokenAccount>,
    pub usdc_token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn handle_claim_faucet(ctx: Context<Faucet>) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    let desk = &ctx.accounts.desk;
    let claim = &mut ctx.accounts.claim;
    // A fresh claim account has last_claim == 0, so the first claim always passes.
    require!(
        claim.last_claim == 0 || now.saturating_sub(claim.last_claim) >= desk.faucet_cooldown,
        DeskError::FaucetCooldown
    );
    claim.user = ctx.accounts.user.key();
    claim.last_claim = now;
    claim.bump = ctx.bumps.claim;

    let seeds: &[&[&[u8]]] = &[&[DESK_SEED, &[desk.bump]]];
    mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.usdc_token_program.key(),
            MintTo {
                mint: ctx.accounts.usdc_mint.to_account_info(),
                to: ctx.accounts.user_usdc.to_account_info(),
                authority: desk.to_account_info(),
            },
            seeds,
        ),
        desk.faucet_amount,
    )?;
    emit!(FaucetClaimed { user: ctx.accounts.user.key(), amount: desk.faucet_amount });
    Ok(())
}
