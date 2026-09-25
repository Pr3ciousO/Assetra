#!/usr/bin/env bash
# Run the Anchor test suite against a fresh local solana-test-validator.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$HERE"

RPC_URL="http://127.0.0.1:8899"
DEPLOYER="../wallets/deployer.keypair.json"
LEDGER="$(mktemp -d)/test-ledger"

cleanup() {
  if [[ -n "${VALIDATOR_PID:-}" ]] && kill -0 "$VALIDATOR_PID" 2>/dev/null; then
    kill "$VALIDATOR_PID" 2>/dev/null || true
    wait "$VALIDATOR_PID" 2>/dev/null || true
  fi
  rm -rf "$(dirname "$LEDGER")" 2>/dev/null || true
}
trap cleanup EXIT

echo "==> Starting solana-test-validator"
solana-test-validator --reset --quiet --ledger "$LEDGER" \
  --bpf-program target/deploy/demo_desk-keypair.json target/deploy/demo_desk.so \
  --bpf-program target/deploy/assetra-keypair.json target/deploy/assetra.so &
VALIDATOR_PID=$!

echo "==> Waiting for validator RPC"
for _ in $(seq 1 60); do
  if solana cluster-version --url "$RPC_URL" >/dev/null 2>&1; then break; fi
  sleep 1
done
solana cluster-version --url "$RPC_URL" >/dev/null

echo "==> Funding deployer"
solana airdrop 100 "$(solana address -k "$DEPLOYER")" --url "$RPC_URL" >/dev/null

echo "==> Running ts-mocha"
ANCHOR_PROVIDER_URL="$RPC_URL" \
ANCHOR_WALLET="$DEPLOYER" \
  pnpm exec ts-mocha -p ./tsconfig.json -t 1000000 'tests/**/*.ts'

echo "==> Tests complete"
