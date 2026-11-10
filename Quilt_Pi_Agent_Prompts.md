# QUILT — READY-TO-PASTE AGENT PROMPTS

These prompts assume the agent already has the user's configured Fast-Ship skills and can access the GitHub repository. They intentionally reference those skills rather than reproducing skill instructions. The product plan is in `Quilt_5_Hour_Backend_First_Execution_Plan.md`. The original product documents (PRD.md, TRD.md, architecture.md, projectplan.md) should be supplied to the agent when available.

## 1. FIRST PI SESSION — multi-slice project bootstrap, backend first

```text
/skill:fast-build

PROJECT: QUILT
REPOSITORY: https://github.com/Devendurance/quilt.git
TARGET CHAIN: BOT Chain; testnet 968, mainnet 677.
TARGET: Finish a secure, functional native-BOT split-payment MVP in a five-hour sprint, with verified mainnet deployment gated by successful backend tests.

READ: The attached Quilt_5_Hour_Backend_First_Execution_Plan.md plus any existing docs/PRD.md, docs/TRD.md, docs/architecture.md and docs/projectplan.md. Do not assume that missing files exist. Preserve unrelated work. The GitHub repo was empty at the time of planning; verify actual remote/local state before initialization. Do not force-push or overwrite an initialized repo.

NON-NEGOTIABLE PRODUCT:
- Create immutable 2–5-recipient splits (unique nonzero addresses, positive weights totaling 10,000 bps).
- Publicly share /s/{id}; any payer submits one native BOT transaction to atomically distribute correct allocations.
- Zero fees, no upgradeable/admin drain, no custodian, no USDT, no fake transactions.
- Exact integer wei math and last-recipient remainder; reject dust allocations that would pay any intended recipient zero wei.
- Persistent creator split IDs, totalPaid and paymentCount must be directly readable on-chain. Official mainnet RPC disables eth_getLogs: do not build the MVP around historical event queries.
- Serious negative, fuzz, recipient-rejection and reentrancy tests; deploy and prove real testnet create/pay BEFORE any frontend contract wiring.
- Frontend only after backend gate: polished mobile pages, wallet, create/share/dashboard/pay, quote, real receipts and failure states.
- Verify contract source and do small genuine mainnet smoke only if hard security gates pass.
- Independent X/site/official footer links and real launch evidence. Do not invent contract addresses, tests, activity or site URLs.

WORKFLOW:
Treat this as a multi-slice MVP. Track progress and checkpoint exact evidence in .fast-build/STATE.md; execute only ONE substantive vertical slice in this Pi session. Slices strictly ordered: A repo/tooling -> B contract+tests -> C testnet CLI proof -> D frontend/wallet -> E QA -> F mainnet/prod.

START NOW WITH SLICE A ONLY: Verify repo is actually empty or adapt to existing work. Clone/init safely, set project structure, choose the fastest sound Solidity toolchain compatible with the environment, initialize Next.js/TypeScript frontend dependencies only as structure (no frontend product implementation yet), wire chain configs, .gitignore/.env.example, README, CI stubs and doc copies if supplied. Commit/push baseline when authorized. Run setup/build sanity checks and report results. Write .fast-build/STATE.md with explicit next slice B.

When done, give: actual files changed, commit SHA, installed tool versions, checks executed, blockers and next-slice prompt. Never say successful unless you have actual output.
```

## 2. NEXT FRESH PI SESSION — backend Solidity contract and tests

```text
/skill:fast-build

Continue QUILT from .fast-build/STATE.md. Perform ONLY slice B: implement the immutable QuiltSplits native-BOT contract and its complete security-focused test suite. No frontend contract wiring yet.

Required interfaces: createSplit(recipients,bps), getSplit(id), getCreatorSplitIds(creator), quoteSplit(id,amount), pay(id); on-chain counters totalPaid/paymentCount; events SplitCreated, RecipientPaid, SplitPaid. Enforce 2–5 unique nonzero recipients, positive bps summing exactly 10000, amount>0, no zero-share payouts, deterministic last-recipient wei remainder, nonReentrant atomic push payout, recipient-transfer failure rollback, no owner drain or mutable splits. Confirm implementation choices and compatibility with existing tooling.

Tests: malformed inputs, 0/missing split, 2/5 payees, awkward wei values, exact sums, duplicate addresses, 0-share dust, malicious rejecting recipient, reentrancy, event values and state invariants. Run actual complete contract suite and fix genuine failures. Commit/push scoped changes, update .fast-build/STATE.md with test results and next step C. No fabricated passing results.
```

## 3. NEXT FRESH PI SESSION — backend/testnet proof gate

```text
/skill:fast-build

Continue QUILT from .fast-build/STATE.md. Perform ONLY slice C, no frontend implementation. Build and run a repeatable Bohr testnet 968 deployment and programmatic create-and-pay script. Verify chain ID and contract bytecode; deploy, create a 60/40 split and pay it from a different test wallet using a tiny amount of tBOT. Capture real receipts and event decoding, exact recipient wei deltas and on-chain counters. Save deployments/968.json with real results and export ABI. Test at least one reverted path. Never log a private key. If faucet, RPC or gas blocks the real test, mark gate BLOCKED rather than faking evidence. Commit/push and update .fast-build/STATE.md. Only after success approve next slice D frontend.
```

## 4. NEXT FRESH PI SESSION — frontend on real contract

```text
/skill:fast-build

Continue QUILT from .fast-build/STATE.md. Perform ONLY slice D, and only if slice C has actual green testnet transaction evidence. Build the independent polished Quilt UI and wire it to the exact tested contract ABI/address and real viem/wagmi calls. Pages: /, /create, /s/[splitId], /dashboard, /about. Wallet connect, wrong chain switch, address/weight validation, immutable-warning, exact quote in integer wei, transaction simulation, wallet approval, pending/failed/confirmed states, explorer receipt, on-chain creator IDs and counters. BOT Chain official mainnet RPC disables eth_getLogs, so do NOT fake history or depend on that method for dashboard. Use authentic on-chain data, not static demo rows. Test a real create/pay flow through the browser on testnet and report hashes. Commit/push, update .fast-build/STATE.md.
```

## 5. NEXT FRESH PI SESSION — QA and safe mainnet release

```text
/skill:fast-build

Continue QUILT from .fast-build/STATE.md. First perform slice E: complete integrated QA, contract negative tests, CI, typecheck/build, mobile 360px, wallet rejection, wrong network, recipient rejection, genuine browser receipt, disabled UI placeholders, and security/secrets checks. If any fund-safety issue remains, STOP mainnet and report it.

If slice E passes, in the NEXT fresh session perform slice F: deploy exact vetted source to BOT Chain chain 677 using a limited-balance secure deployer, verify source on scan.botchain.ai, confirm chain ID/code, execute small real createSplit/pay with independent genuine wallets, verify exact recipient payouts, set production address in env and publish Vercel site. Include BOT Chain name + links to https://botchain.ai and https://scan.botchain.ai in footer. Record actual deployment/tx hashes and launch evidence in docs/LAUNCH_EVIDENCE.md; do not claim mainnet success without receipts. Commit/push deploy artifacts but NEVER secrets. Publish launch text only once live and verified. Continue uptime and user support beyond sprint.
```

## Important usage note

The final QA+release text above describes TWO separate fresh sessions by design. Do not ask the agent to merge them into one enormous unverified run. If your implementation follows `/skill:ship-slice` instead, use each numbered prompt as an independent bounded slice with its own acceptance gate and carry forward the project state explicitly. For a truly multi-slice MVP, `/skill:fast-build` with `.fast-build/STATE.md` is the intended choice.
