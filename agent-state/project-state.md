# project-state.md

- Quilt: native-BOT immutable split payments, BOT Chain (testnet 968, mainnet 677).
- Stack: Next.js 16 + React 19 + Tailwind + viem/wagmi (frontend); Hardhat 2.29.1 + solc 0.8.28 (contracts).
- Decision: Hardhat over Foundry (no forge binary in env; plan permits Hardhat on Windows/Node).
- Architecture: direct-to-contract frontend, no custody backend; views over eth_getLogs (disabled on mainnet RPC).
- Slice A baseline done 2026-11-10. Slice B done: QuiltSplits (2-5 recipients, 10000 bps,
  nonReentrant atomic pay, dust rejection, no fees/admin) + 24 Hardhat tests green.
- Next: Slice D frontend on the proven 968 contract (fresh session).
- Slice D done: routes /, /create, /s/[splitId], /dashboard. wagmi injected connector, chain 968 only,
  direct contract reads/simulate/write, no eth_getLogs (id from receipt logs), no DB.
  Dev signer: scripts/dev-wallet.mjs, enabled only via NEXT_PUBLIC_DEV_WALLET_URL.
- Slice E: src/lib/network.ts (env-driven 968/677, no fallback, mainnet writes off), src/lib/receipt.ts (canonical-address log filtering, payout verification),
  tsconfig.json frontend-only, tsconfig.hardhat.json for contracts/tests. contracts/test/frontend/ holds regression tests (38 tests total with the 24 contract tests).
