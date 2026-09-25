use anchor_lang::prelude::*;
use anchor_spl::token_interface::{mint_to, MintTo};

use crate::{constants::*, error::AssetraError, math::*, state::*};

/// Index PDA signer seeds.
macro_rules! index_seeds {
    ($index:expr) => {
        &[&[INDEX_SEED, $index.symbol.as_bytes(), &[$index.bump]]]
    };
}
pub(crate) use index_seeds;

/// Mint `gross` index tokens: `gross - fee` to `recipient`, `fee` to the treasury.
/// Returns (net, fee).
pub fn mint_index_with_fee<'info>(
    index: &Index,
    index_mint: &AccountInfo<'info>,
    recipient: &AccountInfo<'info>,
    treasury: &AccountInfo<'info>,
    index_authority: &AccountInfo<'info>,
    token_program: &AccountInfo<'info>,
    gross: u64,
) -> Result<(u64, u64)> {
    let fee = fee_of(gross, index.mint_fee_bps);
    let net = gross.checked_sub(fee).ok_or(AssetraError::MathOverflow)?;
    require!(net > 0, AssetraError::ZeroAmount);
    let seeds: &[&[&[u8]]] = index_seeds!(index);
    for (to, amount) in [(recipient, net), (treasury, fee)] {
        if amount == 0 {
            continue;
        }
        mint_to(
            CpiContext::new_with_signer(
                token_program.key(),
                MintTo {
                    mint: index_mint.clone(),
                    to: to.clone(),
                    authority: index_authority.clone(),
                },
                seeds,
            ),
            amount,
        )?;
    }
    Ok((net, fee))
}

/// Buys a full basket with USDC through the desk, delivering each component
/// straight into its vault. Remaining accounts, per component in index order:
/// `[component_mint (mut), vault (mut), price_feed]`.
pub struct BasketBuy<'a, 'info> {
    pub index: &'a Index,
    pub buyer: AccountInfo<'info>,
    pub buyer_usdc: AccountInfo<'info>,
    pub usdc_mint: AccountInfo<'info>,
    pub desk: AccountInfo<'info>,
    pub desk_program: AccountInfo<'info>,
    pub token_program: AccountInfo<'info>,
    pub usdc_token_program: AccountInfo<'info>,
    pub remaining: &'info [AccountInfo<'info>],
    /// Seeds when `buyer` is a PDA (Auto-Invest plan); empty for a wallet.
    pub buyer_seeds: &'a [&'a [&'a [u8]]],
}

impl<'a, 'info> BasketBuy<'a, 'info> {
    /// Spends at most `budget` USDC. Returns (index tokens backed, USDC spent).
    pub fn run(&self, budget: u64) -> Result<(u64, u64)> {
        let comps = self.index.active_components();
        require!(!comps.is_empty(), AssetraError::NoComponents);
        require!(self.remaining.len() == comps.len() * 3, AssetraError::ComponentMismatch);

        // Price every component and compute NAV (micro-USD per whole index
        // token, scaled by 1e9) plus a worst-case rounding margin.
        let mut prices = [0u64; MAX_COMPONENTS];
        let mut nav_e: u128 = 0;
        let mut margin: u64 = 0;
        for (i, c) in comps.iter().enumerate() {
            let mint = &self.remaining[i * 3];
            let vault = &self.remaining[i * 3 + 1];
            let feed_info = &self.remaining[i * 3 + 2];
            require_keys_eq!(mint.key(), c.mint, AssetraError::ComponentMismatch);
            require_keys_eq!(vault.key(), c.vault, AssetraError::ComponentMismatch);
            let feed = Account::<demo_desk::PriceFeed>::try_from(feed_info)?;
            require_keys_eq!(feed.mint, c.mint, AssetraError::FeedMismatch);
            prices[i] = feed.price;

            let scale = 10u128.pow(c.decimals as u32);
            nav_e = (c.units as u128)
                .checked_mul(feed.price as u128)
                .and_then(|v| v.checked_mul(INDEX_UNIT))
                .map(|v| v / scale)
                .and_then(|v| nav_e.checked_add(v))
                .ok_or(AssetraError::MathOverflow)?;
            // Two ceilings per component: one base unit of tokens, one micro-USD.
            let per_unit = (feed.price as u128).div_ceil(scale) as u64;
            margin = margin.saturating_add(per_unit + 1);
        }
        require!(nav_e > 0, AssetraError::BudgetTooSmall);

        let usable = budget.checked_sub(margin).ok_or(AssetraError::BudgetTooSmall)?;
        let index_amount = u64::try_from((usable as u128) * INDEX_UNIT * INDEX_UNIT / nav_e)
            .map_err(|_| AssetraError::MathOverflow)?;
        require!(index_amount > 0, AssetraError::BudgetTooSmall);

        let mut spent: u64 = 0;
        for (i, c) in comps.iter().enumerate() {
            let need = component_required(index_amount, c.units)?;
            let cost = demo_desk::quote_for_tokens_ceil(need, prices[i], c.decimals)?;
            spent = spent.checked_add(cost).ok_or(AssetraError::MathOverflow)?;
            demo_desk::cpi::buy_exact_out(
                CpiContext::new_with_signer(
                    self.desk_program.key(),
                    demo_desk::cpi::accounts::Trade {
                        buyer: self.buyer.clone(),
                        desk: self.desk.clone(),
                        feed: self.remaining[i * 3 + 2].clone(),
                        t_mint: self.remaining[i * 3].clone(),
                        usdc_mint: self.usdc_mint.clone(),
                        buyer_usdc: self.buyer_usdc.clone(),
                        recipient: self.remaining[i * 3 + 1].clone(),
                        t_token_program: self.token_program.clone(),
                        usdc_token_program: self.usdc_token_program.clone(),
                    },
                    self.buyer_seeds,
                ),
                need,
                cost,
            )?;
        }
        require!(spent <= budget, AssetraError::BudgetTooSmall);
        Ok((index_amount, spent))
    }
}
