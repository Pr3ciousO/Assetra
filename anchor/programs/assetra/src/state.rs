use anchor_lang::prelude::*;

use crate::constants::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Default, InitSpace)]
pub struct Component {
    pub mint: Pubkey,
    /// Index-PDA-owned ATA holding this component's backing.
    pub vault: Pubkey,
    /// Component base units backing 1 whole index token (10^9 index base units).
    pub units: u64,
    pub decimals: u8,
}

/// A fully backed, in-kind index. Invariant, per component:
/// `vault.amount >= ceil(supply * units / 10^9)`.
#[account]
#[derive(InitSpace)]
pub struct Index {
    pub authority: Pubkey,
    #[max_len(MAX_SYMBOL_LEN)]
    pub symbol: String,
    pub index_mint: Pubkey,
    /// Index-token account that receives mint/redeem fees.
    pub treasury: Pubkey,
    /// Quote mint for USDC buys and Auto-Invest.
    pub usdc_mint: Pubkey,
    /// Swap venue config account (demo_desk `Desk` on devnet).
    pub desk: Pubkey,
    pub mint_fee_bps: u16,
    pub redeem_fee_bps: u16,
    /// USDC paid from plan escrow to whoever executes an Auto-Invest run.
    pub keeper_tip: u64,
    pub paused: bool,
    pub bump: u8,
    pub mint_bump: u8,
    pub component_count: u8,
    pub components: [Component; MAX_COMPONENTS],
}

impl Index {
    pub fn active_components(&self) -> &[Component] {
        &self.components[..self.component_count as usize]
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum PlanStatus {
    Active,
    Paused,
    Completed,
}

/// Recurring USDC → index buy. USDC sits in an escrow ATA owned by this PDA;
/// anyone may execute a run once it is due and earns the index's keeper tip.
#[account]
#[derive(InitSpace)]
pub struct Plan {
    pub owner: Pubkey,
    pub index: Pubkey,
    pub id: u64,
    pub usdc_per_run: u64,
    pub interval_secs: i64,
    /// 0 = ongoing until cancelled or out of funds.
    pub total_runs: u32,
    pub runs_done: u32,
    pub next_run_ts: i64,
    pub last_run_ts: i64,
    pub created_at: i64,
    pub total_spent: u64,
    pub total_index_bought: u64,
    pub status: PlanStatus,
    pub bump: u8,
}
