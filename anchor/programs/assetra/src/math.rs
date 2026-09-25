use anchor_lang::prelude::*;
use anchor_spl::token_2022::spl_token_2022::{
    extension::{transfer_fee::TransferFeeConfig, BaseStateWithExtensions, StateWithExtensions},
    state::Mint as MintState,
};

use crate::{constants::*, error::AssetraError};

/// Component base units needed to back `index_amount` (rounds up).
pub fn component_required(index_amount: u64, units: u64) -> Result<u64> {
    let v = (index_amount as u128)
        .checked_mul(units as u128)
        .ok_or(AssetraError::MathOverflow)?
        .div_ceil(INDEX_UNIT);
    u64::try_from(v).map_err(|_| AssetraError::MathOverflow.into())
}

/// Component base units paid out for burning `index_amount` (rounds down).
pub fn component_payout(index_amount: u64, units: u64) -> Result<u64> {
    let v = (index_amount as u128)
        .checked_mul(units as u128)
        .ok_or(AssetraError::MathOverflow)?
        / INDEX_UNIT;
    u64::try_from(v).map_err(|_| AssetraError::MathOverflow.into())
}

pub fn fee_of(amount: u64, bps: u16) -> u64 {
    ((amount as u128 * bps as u128) / BPS_DENOM as u128) as u64
}

/// Amount to send so the recipient receives at least `required` after any
/// Token-2022 transfer fee on `mint`.
pub fn gross_up_for_transfer_fee(mint: &AccountInfo, required: u64) -> Result<u64> {
    let data = mint.try_borrow_data()?;
    let state = StateWithExtensions::<MintState>::unpack(&data)?;
    match state.get_extension::<TransferFeeConfig>() {
        Ok(cfg) => {
            let epoch = Clock::get()?.epoch;
            cfg.get_epoch_fee(epoch)
                .calculate_pre_fee_amount(required)
                .ok_or(AssetraError::MathOverflow.into())
        }
        Err(_) => Ok(required),
    }
}

/// Read a token account's balance (same layout offset for SPL Token and Token-2022).
pub fn token_balance(account: &AccountInfo) -> Result<u64> {
    let data = account.try_borrow_data()?;
    require!(data.len() >= 72, AssetraError::ComponentMismatch);
    Ok(u64::from_le_bytes(data[64..72].try_into().unwrap()))
}
