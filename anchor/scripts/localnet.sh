#!/usr/bin/env bash
# Persistent local validator with both programs preloaded (for web dev).
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$HERE"
mkdir -p .anchor
exec solana-test-validator --reset --quiet --ledger .anchor/localnet-ledger \
  --bpf-program target/deploy/demo_desk-keypair.json target/deploy/demo_desk.so \
  --bpf-program target/deploy/assetra-keypair.json target/deploy/assetra.so
