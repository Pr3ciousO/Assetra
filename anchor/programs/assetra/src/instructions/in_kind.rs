use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::Token2022,
    token_interface::{burn, transfer_checked, Burn, Mint, TokenAccount, TransferChecked},
};

use crate::{
    constants::*,
    error::AssetraError,
    instructions::basket::{index_seeds, mint_index_with_fee},
    math::*,
    state::*,
};

#[event]
pub struct IndexMinted {
    pub index: Pubkey,
    pub user: Pubkey,
    pub amount: u64,
    pub fee: u64,
}

#[event]
pub struct IndexRedeemed {
    pub index: Pubkey,
    pub user: Pubkey,
    pub amount: u64,
    pub fee: u64,
}

#[derive(Accounts)]
pub struct MintInKind<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        seeds = [INDEX_SEED, index.symbol.as_bytes()],
        bump = index.bump,
        has_one = index_mint,
        has_one = treasury,
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
    pub token_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

/// Deposit the exact basket for `amount` index tokens and mint them.
/// Remaining accounts, per component in index order:
/// `[component_mint, user_component_account (mut), vault (mut)]`.
/// Sends enough extra to cover each component's Token-2022 transfer fee and
/// verifies the vault actually received what backing requires.
pub fn handle_mint_in_kind<'info>(ctx: Context<'info, MintInKind<'info>>, amount: u64) -> Result<()> {
    let a = &ctx.accounts;
    require!(!a.index.paused, AssetraError::Paused);
    require!(amount > 0, AssetraError::ZeroAmount);
    let comps = a.index.active_components();
    require!(!comps.is_empty(), AssetraError::NoComponents);
    let rem = ctx.remaining_accounts;
    require!(rem.len() == comps.len() * 3, AssetraError::ComponentMismatch);

    for (i, c) in comps.iter().enumerate() {
        let (mint, from, vault) = (&rem[i * 3], &rem[i * 3 + 1], &rem[i * 3 + 2]);
        require_keys_eq!(mint.key(), c.mint, AssetraError::ComponentMismatch);
        require_keys_eq!(vault.key(), c.vault, AssetraError::ComponentMismatch);

        let required = component_required(amount, c.units)?;
        let gross = gross_up_for_transfer_fee(mint, required)?;
        let before = token_balance(vault)?;
        transfer_checked(
            CpiContext::new(
                a.token_program.key(),
                TransferChecked {
                    from: from.clone(),
                    mint: mint.clone(),
                    to: vault.clone(),
                    authority: a.user.to_account_info(),
                },
            ),
            gross,
            c.decimals,
        )?;
        let received = token_balance(vault)?.saturating_sub(before);
        require!(received >= required, AssetraError::InsufficientDeposit);
    }

    let (net, fee) = mint_index_with_fee(
        &a.index,
        &a.index_mint.to_account_info(),
        &a.user_index.to_account_info(),
        &a.treasury.to_account_info(),
        &a.index.to_account_info(),
        &a.token_program.to_account_info(),
        amount,
    )?;
    emit!(IndexMinted { index: a.index.key(), user: a.user.key(), amount: net, fee });
    Ok(())
}

#[derive(Accounts)]
pub struct RedeemInKind<'info> {
    pub user: Signer<'info>,
    #[account(
        seeds = [INDEX_SEED, index.symbol.as_bytes()],
        bump = index.bump,
        has_one = index_mint,
        has_one = treasury,
    )]
    pub index: Box<Account<'info, Index>>,
    #[account(mut)]
    pub index_mint: Box<InterfaceAccount<'info, Mint>>,
    #[account(
        mut,
        token::mint = index_mint,
        token::authority = user,
        token::token_program = token_program,
    )]
    pub user_index: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(mut)]
    pub treasury: Box<InterfaceAccount<'info, TokenAccount>>,
    pub token_program: Program<'info, Token2022>,
}

/// Burn `amount` index tokens (less the redeem fee, which goes to the
/// treasury) and receive the pro-rata backing of every component.
/// Remaining accounts, per component in index order:
/// `[component_mint, vault (mut), user_component_account (mut)]`.
/// Redemption ignores `paused`: holders can always exit.
pub fn handle_redeem_in_kind<'info>(ctx: Context<'info, RedeemInKind<'info>>, amount: u64) -> Result<()> {
    let a = &ctx.accounts;
    require!(amount > 0, AssetraError::ZeroAmount);
    let comps = a.index.active_components();
    let rem = ctx.remaining_accounts;
    require!(rem.len() == comps.len() * 3, AssetraError::ComponentMismatch);

    let fee = fee_of(amount, a.index.redeem_fee_bps);
    let net = amount.checked_sub(fee).ok_or(AssetraError::MathOverflow)?;
    require!(net > 0, AssetraError::ZeroAmount);

    let token_program = a.token_program.key();
    if fee > 0 {
        transfer_checked(
            CpiContext::new(
                token_program,
                TransferChecked {
                    from: a.user_index.to_account_info(),
                    mint: a.index_mint.to_account_info(),
                    to: a.treasury.to_account_info(),
                    authority: a.user.to_account_info(),
                },
            ),
            fee,
            INDEX_DECIMALS,
        )?;
    }
    burn(
        CpiContext::new(
            token_program,
            Burn {
                mint: a.index_mint.to_account_info(),
                from: a.user_index.to_account_info(),
                authority: a.user.to_account_info(),
            },
        ),
        net,
    )?;

    let seeds: &[&[&[u8]]] = index_seeds!(a.index);
    for (i, c) in comps.iter().enumerate() {
        let (mint, vault, to) = (&rem[i * 3], &rem[i * 3 + 1], &rem[i * 3 + 2]);
        require_keys_eq!(mint.key(), c.mint, AssetraError::ComponentMismatch);
        require_keys_eq!(vault.key(), c.vault, AssetraError::ComponentMismatch);
        let payout = component_payout(net, c.units)?;
        if payout == 0 {
            continue;
        }
        transfer_checked(
            CpiContext::new_with_signer(
                token_program,
                TransferChecked {
                    from: vault.clone(),
                    mint: mint.clone(),
                    to: to.clone(),
                    authority: a.index.to_account_info(),
                },
                seeds,
            ),
            payout,
            c.decimals,
        )?;
    }
    emit!(IndexRedeemed { index: a.index.key(), user: a.user.key(), amount: net, fee });
    Ok(())
}
