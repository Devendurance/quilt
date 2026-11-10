# project-state.md

- Quilt: native-BOT immutable split payments, BOT Chain (testnet 968, mainnet 677).
- Stack: Next.js 16 + React 19 + Tailwind + viem/wagmi (frontend); Hardhat 2.29.1 + solc 0.8.28 (contracts).
- Decision: Hardhat over Foundry (no forge binary in env; plan permits Hardhat on Windows/Node).
- Architecture: direct-to-contract frontend, no custody backend; views over eth_getLogs (disabled on mainnet RPC).
- Slice A baseline done 2026-11-10. Slice B done: QuiltSplits (2-5 recipients, 10000 bps,
  nonReentrant atomic pay, dust rejection, no fees/admin) + 24 Hardhat tests green.
- Next: Slice C testnet proof.
