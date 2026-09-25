const KNOWN: Record<string, string> = {
  SlippageExceeded: "Price moved beyond your slippage limit. Try again.",
  FaucetCooldown: "Faucet already claimed. Try again in an hour.",
  StalePrice: "Price feed is refreshing. Try again in a minute.",
  PlanUnderfunded: "Plan escrow can't cover the next run. Top it up.",
  PlanNotDue: "This run isn't due yet.",
  BudgetTooSmall: "Amount too small to buy any FRNT.",
  InsufficientDeposit: "Not enough of a component to mint.",
  Paused: "The index is paused.",
  "insufficient funds": "Insufficient balance.",
  "insufficient lamports": "Not enough SOL for fees.",
};

export function friendlyError(e: unknown): string {
  const err = e as { message?: string; logs?: string[]; name?: string };
  const text = `${err?.message ?? ""} ${(err?.logs ?? []).join(" ")}`;
  if (/reject|denied|cancell?ed/i.test(text) || err?.name === "WalletSignTransactionError") return "Request cancelled in wallet.";
  for (const [k, v] of Object.entries(KNOWN)) if (text.includes(k)) return v;
  if (/0x1\b/.test(text)) return "Insufficient token balance.";
  return err?.message?.slice(0, 140) || "Transaction failed.";
}
