use anchor_lang::{prelude::*, system_program};
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::Token2022,
    token_interface::{
        spl_token_metadata_interface::state::Field, token_metadata_initialize, token_metadata_update_field, Mint,
        TokenAccount, TokenMetadataInitialize, TokenMetadataUpdateField,
    },
};

use crate::{constants::*, error::AssetraError, state::*};

#[derive(Accounts)]
#[instruction(symbol: String)]
pub struct InitIndex<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + Index::INIT_SPACE,
        seeds = [INDEX_SEED, symbol.as_bytes()],
        bump,
    )]
    pub index: Box<Account<'info, Index>>,
    #[account(
        init,
        payer = authority,
        seeds = [INDEX_MINT_SEED, index.key().as_ref()],
        bump,
        mint::decimals = INDEX_DECIMALS,
        mint::authority = index,
        mint::token_program = token_program,
        extensions::metadata_pointer::authority = index,
        extensions::metadata_pointer::metadata_address = index_mint,
    )]
    pub index_mint: Box<InterfaceAccount<'info, Mint>>,
    /// CHECK: any wallet; owns the fee treasury token account.
    pub treasury_owner: UncheckedAccount<'info>,
    #[account(
        init,
        payer = authority,
        associated_token::mint = index_mint,
        associated_token::authority = treasury_owner,
        associated_token::token_program = token_program,
    )]
    pub treasury: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(constraint = desk.usdc_mint == usdc_mint.key())]
    pub usdc_mint: Box<InterfaceAccount<'info, Mint>>,
    pub desk: Box<Account<'info, demo_desk::Desk>>,
    pub token_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[allow(clippy::too_many_arguments)]
pub fn handle_init_index(
    ctx: Context<InitIndex>,
    symbol: String,
    name: String,
    uri: String,
    mint_fee_bps: u16,
    redeem_fee_bps: u16,
    keeper_tip: u64,
) -> Result<()> {
    require!(symbol.len() <= MAX_SYMBOL_LEN, AssetraError::SymbolTooLong);
    require!(
        mint_fee_bps <= MAX_FEE_BPS && redeem_fee_bps <= MAX_FEE_BPS,
        AssetraError::FeeTooHigh
    );

    let index_key = ctx.accounts.index.key();
    let bump = ctx.bumps.index;
    ctx.accounts.index.set_inner(Index {
        authority: ctx.accounts.authority.key(),
        symbol: symbol.clone(),
        index_mint: ctx.accounts.index_mint.key(),
        treasury: ctx.accounts.treasury.key(),
        usdc_mint: ctx.accounts.usdc_mint.key(),
        desk: ctx.accounts.desk.key(),
        mint_fee_bps,
        redeem_fee_bps,
        keeper_tip,
        paused: false,
        bump,
        mint_bump: ctx.bumps.index_mint,
        component_count: 0,
        components: [Component::default(); MAX_COMPONENTS],
    });

    // Fund the mint for the Token-2022 metadata the next CPI appends (TLV
    // header + borsh TokenMetadata with no additional fields).
    let meta_len = 4 + 32 + 32 + (4 + name.len()) + (4 + symbol.len()) + (4 + uri.len()) + 4;
    let mint_info = ctx.accounts.index_mint.to_account_info();
    let needed = Rent::get()?.minimum_balance(mint_info.data_len() + meta_len);
    let top_up = needed.saturating_sub(mint_info.lamports());
    if top_up > 0 {
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.key(),
                system_program::Transfer {
                    from: ctx.accounts.authority.to_account_info(),
                    to: mint_info.clone(),
                },
            ),
            top_up,
        )?;
    }

    let seeds: &[&[&[u8]]] = &[&[INDEX_SEED, symbol.as_bytes(), &[bump]]];
    token_metadata_initialize(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.key(),
            TokenMetadataInitialize {
                program_id: ctx.accounts.token_program.to_account_info(),
                metadata: mint_info.clone(),
                update_authority: ctx.accounts.index.to_account_info(),
                mint_authority: ctx.accounts.index.to_account_info(),
                mint: mint_info,
            },
            seeds,
        ),
        name,
        symbol.clone(),
        uri,
    )?;

    emit!(IndexCreated { index: index_key, index_mint: ctx.accounts.index_mint.key() });
    Ok(())
}

#[derive(Accounts)]
pub struct AddComponent<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        seeds = [INDEX_SEED, index.symbol.as_bytes()],
        bump = index.bump,
        has_one = authority,
        has_one = index_mint,
    )]
    pub index: Box<Account<'info, Index>>,
    pub index_mint: Box<InterfaceAccount<'info, Mint>>,
    #[account(mint::token_program = token_program)]
    pub component_mint: Box<InterfaceAccount<'info, Mint>>,
    #[account(
        init,
        payer = authority,
        associated_token::mint = component_mint,
        associated_token::authority = index,
        associated_token::token_program = token_program,
    )]
    pub vault: Box<InterfaceAccount<'info, TokenAccount>>,
    pub token_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn handle_add_component(ctx: Context<AddComponent>, units: u64) -> Result<()> {
    require!(units > 0, AssetraError::ZeroAmount);
    require!(ctx.accounts.index_mint.supply == 0, AssetraError::CompositionLocked);
    let mint = ctx.accounts.component_mint.key();
    let index = &mut ctx.accounts.index;
    let n = index.component_count as usize;
    require!(n < MAX_COMPONENTS, AssetraError::TooManyComponents);
    require!(
        index.active_components().iter().all(|c| c.mint != mint),
        AssetraError::DuplicateComponent
    );
    index.components[n] = Component {
        mint,
        vault: ctx.accounts.vault.key(),
        units,
        decimals: ctx.accounts.component_mint.decimals,
    };
    index.component_count += 1;
    Ok(())
}

#[derive(Accounts)]
pub struct SetParams<'info> {
    pub authority: Signer<'info>,
    #[account(mut, seeds = [INDEX_SEED, index.symbol.as_bytes()], bump = index.bump, has_one = authority)]
    pub index: Box<Account<'info, Index>>,
}

pub fn handle_set_params(
    ctx: Context<SetParams>,
    mint_fee_bps: u16,
    redeem_fee_bps: u16,
    keeper_tip: u64,
    paused: bool,
) -> Result<()> {
    require!(
        mint_fee_bps <= MAX_FEE_BPS && redeem_fee_bps <= MAX_FEE_BPS,
        AssetraError::FeeTooHigh
    );
    let index = &mut ctx.accounts.index;
    index.mint_fee_bps = mint_fee_bps;
    index.redeem_fee_bps = redeem_fee_bps;
    index.keeper_tip = keeper_tip;
    index.paused = paused;
    Ok(())
}

#[derive(Accounts)]
pub struct SetMetadataUri<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        seeds = [INDEX_SEED, index.symbol.as_bytes()],
        bump = index.bump,
        has_one = authority,
        has_one = index_mint,
    )]
    pub index: Box<Account<'info, Index>>,
    #[account(mut)]
    pub index_mint: Box<InterfaceAccount<'info, Mint>>,
    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
}

/// Point the index token's on-mint metadata at a new JSON URI.
pub fn handle_set_metadata_uri(ctx: Context<SetMetadataUri>, uri: String) -> Result<()> {
    // Over-fund for the new value; the token program reallocs in place.
    let mint_info = ctx.accounts.index_mint.to_account_info();
    let needed = Rent::get()?.minimum_balance(mint_info.data_len() + uri.len());
    let top_up = needed.saturating_sub(mint_info.lamports());
    if top_up > 0 {
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.key(),
                system_program::Transfer {
                    from: ctx.accounts.authority.to_account_info(),
                    to: mint_info.clone(),
                },
            ),
            top_up,
        )?;
    }
    let index = &ctx.accounts.index;
    let seeds: &[&[&[u8]]] = &[&[INDEX_SEED, index.symbol.as_bytes(), &[index.bump]]];
    token_metadata_update_field(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.key(),
            TokenMetadataUpdateField {
                program_id: ctx.accounts.token_program.to_account_info(),
                metadata: mint_info,
                update_authority: index.to_account_info(),
            },
            seeds,
        ),
        Field::Uri,
        uri,
    )
}

#[event]
pub struct IndexCreated {
    pub index: Pubkey,
    pub index_mint: Pubkey,
}
