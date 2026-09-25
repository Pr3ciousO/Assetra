use anchor_lang::prelude::*;

#[error_code]
pub enum AssetraError {
    #[msg("Index is paused")]
    Paused,
    #[msg("Amount must be greater than zero")]
    ZeroAmount,
    #[msg("Fee exceeds the maximum")]
    FeeTooHigh,
    #[msg("Symbol too long")]
    SymbolTooLong,
    #[msg("Index already has the maximum number of components")]
    TooManyComponents,
    #[msg("Component already exists")]
    DuplicateComponent,
    #[msg("Composition is locked once index tokens exist")]
    CompositionLocked,
    #[msg("Index has no components")]
    NoComponents,
    #[msg("Remaining accounts do not match the index components")]
    ComponentMismatch,
    #[msg("Vault received less than required")]
    InsufficientDeposit,
    #[msg("Output below minimum (slippage)")]
    SlippageExceeded,
    #[msg("Budget too small to buy any index tokens")]
    BudgetTooSmall,
    #[msg("Price feed does not match component")]
    FeedMismatch,
    #[msg("Interval too short")]
    IntervalTooShort,
    #[msg("Plan is not active")]
    PlanNotActive,
    #[msg("Plan is not paused")]
    PlanNotPaused,
    #[msg("Plan run is not due yet")]
    PlanNotDue,
    #[msg("Plan escrow cannot cover the next run")]
    PlanUnderfunded,
    #[msg("Arithmetic overflow")]
    MathOverflow,
}
