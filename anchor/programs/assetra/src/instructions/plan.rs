use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::Token2022,
    token_interface::{close_account, transfer_checked, CloseAccount, Mint, TokenAccount, TokenInterface, TransferChecked},
};
use demo_desk::program::DemoDesk;

use crate::{
    constants::*,
    error::AssetraError,
    instructions::basket::{mint_index_with_fee, BasketBuy},
    state::*,
};

#[event]
pub struct PlanCreated {
    pub plan: Pubkey,
    pub owner: Pubkey,
    pub usdc_per_run: u64,
    pub interval_secs: i64,
    pub total_runs: u32,
}

#[event]
pub struct PlanExecuted {
    pub plan: Pubkey,
    pub owner: Pubkey,
    pub keeper: Pubkey,
    pub run: u32,
    pub usdc_spent: u64,
    pub amount: u64,
    pub next_run_ts: i64,
}

#[event]
pub struct PlanCancelled {
    pub plan: Pubkey,
    pub refunded: u64,
}

macro_rules! plan_seeds {
    ($index:expr, $owner:expr, $id:expr, $bump:expr) => {
        [PLAN_SEED, $index.as_ref(), $owner.as_ref(), &$id[..], &$bump[..]]
    };
}

fn move_usdc<'info>(
    token_program: &AccountInfo<'info>,
    from: &AccountInfo<'info>,
    mint: &InterfaceAccount<'info, Mint>,
    to: &AccountInfo<'info>,
    authority: &AccountInfo<'info>,
    seeds: &[&[&[u8]]],
    amount: u64,
) -> Result<()> {
    transfer_checked(
        CpiContext::new_with_signer(
            token_program.key(),
            TransferChecked {
                from: from.clone(),
                mint: mint.to_account_info(),
                to: to.clone(),
                authority: authority.clone(),
            },
            seeds,
        ),
        amount,
        mint.decimals,
    )
}

#[derive(Accounts)]
#[instruction(id: u64)]
pub struct CreatePlan<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        seeds = [INDEX_SEED, index.symbol.as_bytes()],
        bump = index.bump,
        has_one = index_mint,
        has_one = usdc_mint,
    )]
    pub index: Box<Account<'info, Index>>,
    pub index_mint: Box<InterfaceAccount<'info, Mint>>,
    #[account(
        init,
        payer = owner,
        space = 8 + Plan::INIT_SPACE,
        seeds = [PLAN_SEED, index.key().as_ref(), owner.key().as_ref(), &id.to_le_bytes()],
        bump,
    )]
    pub plan: Box<Account<'info, Plan>>,
    pub usdc_mint: Box<InterfaceAccount<'info, Mint>>,
    #[account(
        init,
        payer = owner,
        associated_token::mint = usdc_mint,
        associated_token::authority = plan,
        associated_token::token_program = usdc_token_program,
    )]
    pub escrow: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        mut,
        token::mint = usdc_mint,
        token::authority = owner,
        token::token_program = usdc_token_program,
    )]
    pub owner_usdc: Box<InterfaceAccount<'info, TokenAccount>>,
    /// Created up front so runs never need the owner to pay rent.
    #[account(
        init_if_needed,
        payer = owner,
        associated_token::mint = index_mint,
        associated_token::authority = owner,
        associated_token::token_program = token_program,
    )]
    pub owner_index: Box<InterfaceAccount<'info, TokenAccount>>,
    pub token_program: Program<'info, Token2022>,
    pub usdc_token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

/// Open an Auto-Invest plan and fund its escrow. The first run is due immediately.
pub fn handle_create_plan(
    ctx: Context<CreatePlan>,
    id: u64,
    usdc_per_run: u64,
    interval_secs: i64,
    total_runs: u32,
    deposit: u64,
) -> Result<()> {
    require!(!ctx.accounts.index.paused, AssetraError::Paused);
    require!(usdc_per_run > 0 && deposit > 0, AssetraError::ZeroAmount);
    require!(interval_secs >= MIN_PLAN_INTERVAL, AssetraError::IntervalTooShort);

    let now = Clock::get()?.unix_timestamp;
    let plan_key = ctx.accounts.plan.key();
    ctx.accounts.plan.set_inner(Plan {
        owner: ctx.accounts.owner.key(),
        index: ctx.accounts.index.key(),
        id,
        usdc_per_run,
        interval_secs,
        total_runs,
        runs_done: 0,
        next_run_ts: now,
        last_run_ts: 0,
        created_at: now,
        total_spent: 0,
        total_index_bought: 0,
        status: PlanStatus::Active,
        bump: ctx.bumps.plan,
    });

    move_usdc(
        &ctx.accounts.usdc_token_program.to_account_info(),
        &ctx.accounts.owner_usdc.to_account_info(),
        &ctx.accounts.usdc_mint,
        &ctx.accounts.escrow.to_account_info(),
        &ctx.accounts.owner.to_account_info(),
        &[],
        deposit,
    )?;
    emit!(PlanCreated {
        plan: plan_key,
        owner: ctx.accounts.owner.key(),
        usdc_per_run,
        interval_secs,
        total_runs,
    });
    Ok(())
}

#[derive(Accounts)]
pub struct TopUpPlan<'info> {
    pub owner: Signer<'info>,
    #[account(has_one = owner)]
    pub plan: Box<Account<'info, Plan>>,
    pub usdc_mint: Box<InterfaceAccount<'info, Mint>>,
    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = plan,
        associated_token::token_program = usdc_token_program,
    )]
    pub escrow: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        mut,
        token::mint = usdc_mint,
        token::authority = owner,
        token::token_program = usdc_token_program,
    )]
    pub owner_usdc: Box<InterfaceAccount<'info, TokenAccount>>,
    pub usdc_token_program: Interface<'info, TokenInterface>,
}

pub fn handle_top_up_plan(ctx: Context<TopUpPlan>, amount: u64) -> Result<()> {
    require!(amount > 0, AssetraError::ZeroAmount);
    move_usdc(
        &ctx.accounts.usdc_token_program.to_account_info(),
        &ctx.accounts.owner_usdc.to_account_info(),
        &ctx.accounts.usdc_mint,
        &ctx.accounts.escrow.to_account_info(),
        &ctx.accounts.owner.to_account_info(),
        &[],
        amount,
    )
}

#[derive(Accounts)]
pub struct SetPlanStatus<'info> {
    pub owner: Signer<'info>,
    #[account(mut, has_one = owner)]
    pub plan: Box<Account<'info, Plan>>,
}

pub fn handle_pause_plan(ctx: Context<SetPlanStatus>) -> Result<()> {
    let plan = &mut ctx.accounts.plan;
    require!(plan.status == PlanStatus::Active, AssetraError::PlanNotActive);
    plan.status = PlanStatus::Paused;
    Ok(())
}

pub fn handle_resume_plan(ctx: Context<SetPlanStatus>) -> Result<()> {
    let plan = &mut ctx.accounts.plan;
    require!(plan.status == PlanStatus::Paused, AssetraError::PlanNotPaused);
    plan.status = PlanStatus::Active;
    plan.next_run_ts = plan.next_run_ts.max(Clock::get()?.unix_timestamp);
    Ok(())
}

#[derive(Accounts)]
pub struct CancelPlan<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut, has_one = owner, close = owner)]
    pub plan: Box<Account<'info, Plan>>,
    pub usdc_mint: Box<InterfaceAccount<'info, Mint>>,
    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = plan,
        associated_token::token_program = usdc_token_program,
    )]
    pub escrow: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        mut,
        token::mint = usdc_mint,
        token::authority = owner,
        token::token_program = usdc_token_program,
    )]
    pub owner_usdc: Box<InterfaceAccount<'info, TokenAccount>>,
    pub usdc_token_program: Interface<'info, TokenInterface>,
}

/// Refund all escrowed USDC and close the plan and its escrow.
pub fn handle_cancel_plan(ctx: Context<CancelPlan>) -> Result<()> {
    let plan = &ctx.accounts.plan;
    let (index_key, owner_key, id, bump) = (plan.index, plan.owner, plan.id.to_le_bytes(), [plan.bump]);
    let seeds = plan_seeds!(index_key, owner_key, id, bump);
    let signer: &[&[&[u8]]] = &[&seeds];
    let token_program = ctx.accounts.usdc_token_program.to_account_info();
    let plan_info = ctx.accounts.plan.to_account_info();

    let refunded = ctx.accounts.escrow.amount;
    if refunded > 0 {
        move_usdc(
            &token_program,
            &ctx.accounts.escrow.to_account_info(),
            &ctx.accounts.usdc_mint,
            &ctx.accounts.owner_usdc.to_account_info(),
            &plan_info,
            signer,
            refunded,
        )?;
    }
    close_account(CpiContext::new_with_signer(
        token_program.key(),
        CloseAccount {
            account: ctx.accounts.escrow.to_account_info(),
            destination: ctx.accounts.owner.to_account_info(),
            authority: plan_info,
        },
        signer,
    ))?;
    emit!(PlanCancelled { plan: ctx.accounts.plan.key(), refunded });
    Ok(())
}

#[derive(Accounts)]
pub struct ExecutePlan<'info> {
    pub keeper: Signer<'info>,
    #[account(
        mut,
        seeds = [PLAN_SEED, index.key().as_ref(), owner.key().as_ref(), &plan.id.to_le_bytes()],
        bump = plan.bump,
        has_one = index,
        has_one = owner,
    )]
    pub plan: Box<Account<'info, Plan>>,
    /// CHECK: bound to the plan by `has_one = owner`.
    pub owner: UncheckedAccount<'info>,
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
        mut,
        associated_token::mint = index_mint,
        associated_token::authority = owner,
        associated_token::token_program = token_program,
    )]
    pub owner_index: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(mut)]
    pub treasury: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(mut)]
    pub usdc_mint: Box<InterfaceAccount<'info, Mint>>,
    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = plan,
        associated_token::token_program = usdc_token_program,
    )]
    pub escrow: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(mut, token::mint = usdc_mint, token::token_program = usdc_token_program)]
    pub keeper_usdc: Box<InterfaceAccount<'info, TokenAccount>>,
    /// CHECK: bound by `has_one = desk`; validated by the desk program.
    pub desk: UncheckedAccount<'info>,
    pub desk_program: Program<'info, DemoDesk>,
    pub token_program: Program<'info, Token2022>,
    pub usdc_token_program: Interface<'info, TokenInterface>,
}

/// Permissionless: execute a due run. Pays the keeper tip from escrow, buys
/// the basket with `usdc_per_run`, and mints the index tokens to the owner.
/// Remaining accounts as in `buy_with_usdc`.
pub fn handle_execute_plan<'info>(ctx: Context<'info, ExecutePlan<'info>>) -> Result<()> {
    let a = &ctx.accounts;
    require!(!a.index.paused, AssetraError::Paused);
    let plan = &a.plan;
    require!(plan.status == PlanStatus::Active, AssetraError::PlanNotActive);
    let now = Clock::get()?.unix_timestamp;
    require!(now >= plan.next_run_ts, AssetraError::PlanNotDue);
    let tip = a.index.keeper_tip;
    let needed = plan.usdc_per_run.checked_add(tip).ok_or(AssetraError::MathOverflow)?;
    require!(a.escrow.amount >= needed, AssetraError::PlanUnderfunded);

    let (index_key, owner_key, id, bump) = (plan.index, plan.owner, plan.id.to_le_bytes(), [plan.bump]);
    let seeds = plan_seeds!(index_key, owner_key, id, bump);
    let signer: &[&[&[u8]]] = &[&seeds];
    let plan_info = a.plan.to_account_info();
    let usdc_token_program = a.usdc_token_program.to_account_info();

    if tip > 0 {
        move_usdc(
            &usdc_token_program,
            &a.escrow.to_account_info(),
            &a.usdc_mint,
            &a.keeper_usdc.to_account_info(),
            &plan_info,
            signer,
            tip,
        )?;
    }

    let (gross, spent) = BasketBuy {
        index: &a.index,
        buyer: plan_info,
        buyer_usdc: a.escrow.to_account_info(),
        usdc_mint: a.usdc_mint.to_account_info(),
        desk: a.desk.to_account_info(),
        desk_program: a.desk_program.to_account_info(),
        token_program: a.token_program.to_account_info(),
        usdc_token_program,
        remaining: ctx.remaining_accounts,
        buyer_seeds: signer,
    }
    .run(plan.usdc_per_run)?;

    let (net, _fee) = mint_index_with_fee(
        &a.index,
        &a.index_mint.to_account_info(),
        &a.owner_index.to_account_info(),
        &a.treasury.to_account_info(),
        &a.index.to_account_info(),
        &a.token_program.to_account_info(),
        gross,
    )?;

    let plan = &mut ctx.accounts.plan;
    plan.runs_done += 1;
    plan.last_run_ts = now;
    plan.total_spent = plan.total_spent.saturating_add(spent);
    plan.total_index_bought = plan.total_index_bought.saturating_add(net);
    // Skip missed slots instead of bursting through a backlog.
    let next = plan.next_run_ts.saturating_add(plan.interval_secs);
    plan.next_run_ts = if next > now { next } else { now + plan.interval_secs };
    if plan.total_runs > 0 && plan.runs_done >= plan.total_runs {
        plan.status = PlanStatus::Completed;
    }
    emit!(PlanExecuted {
        plan: plan.key(),
        owner: plan.owner,
        keeper: ctx.accounts.keeper.key(),
        run: plan.runs_done,
        usdc_spent: spent,
        amount: net,
        next_run_ts: plan.next_run_ts,
    });
    Ok(())
}
