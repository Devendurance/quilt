# QUILT — FIVE-HOUR, BACKEND-FIRST EXECUTION PLAN

**Version:** Sprint 1.0 · **Date:** Tuesday, November 10, 2026 · **Target launch:** Friday, November 13, 2026  
**GitHub:** https://github.com/Devendurance/quilt · **Project:** Quilt (formerly SplitNest) · **Blockchain:** BOT Chain  
**Execution mode:** AI coding agent, one independently tested vertical slice at a time. **Order is mandatory: backend first, contract/testnet proof before frontend integration.**

> This document is a build specification and action plan, **not evidence** that Quilt is already deployed, tested, audited or live. A five-hour deadline is a planning constraint, not permission to weaken money-moving contract security. If a hard gate fails, stop before mainnet launch.

## 0. Definition of a complete Quilt V1

Quilt is a native-BOT, non-custodial split-payment DApp. A creator defines 2–5 distinct recipient EVM addresses and fixed percentages summing to exactly 100%. The smart contract permanently records those allocations. Any payer opens the public split link, reviews the recipients and amounts, submits **one native BOT** payment, and the contract sends the correct shares to all recipients **atomically**. The app shows a genuine receipt, not a decorative success state.

**P0 scope (do not skip):**

- Independent Quilt repository, deployment environments, version control, README, CI.
- BOT Chain (testnet 968 + mainnet 677) configuration, wallet connection, network switch, balance and gas information.
- Secure smart contract that creates immutable 2–5-recipient splits, previews share amounts and atomically pays native BOT with no fees.
- Automated tests of validation, exact integer allocation, rounding, failure/rollback, unexpected recipients and reentrancy.
- Real testnet create-and-pay flow run **without** the frontend, using a repeatable integration script.
- Deployment script, environment-specific ABI/address export, explorer source verification and on-chain post-deploy smoke checks.
- Public, mobile-friendly landing page; split creation; public shareable split details; payment flow; creator's splits dashboard; transaction-state/receipt UX; help/trust explanations.
- Mainnet small-value genuine smoke transaction, independently validated addresses and confirmed payouts; operational alerts and support path.
- Five meaningful project-specific X posts in the last 30 days; accurate mainnet launch announcement once live; BOT Chain name/logo and both `https://botchain.ai` and `https://scan.botchain.ai` footer links; documentation of three genuine interacting wallets and five valid core interactions within the actual seven-day post-launch window **if organically achieved and approved by Mary**.

**Out of scope (not skipped; consciously deferred):** USDT/other ERC-20s, fiat/off-ramp, cross-chain swaps, team admin/permissions, mutable percentages, subscriptions, escrow/dispute resolution, upgradeable proxies, revenue fees, historical payment indexer, admin backdoor, token issuance and big analytics dashboards. These are separate later products/features.

**Hard distinction for Mary's rule:** receiving BOT passively does **not** necessarily make a wallet a valid interacting user. Recruit genuine creators and payers; confirm counting methodology with Mary. Never wash trade, invent wallets or manufacture on-chain activity.

## 1. Verified chain facts and a backend architecture decision

| Environment | Chain ID | RPC | Explorer | Currency |
| --- | --- | --- | --- | --- |
| Bohr testnet | 968 | https://rpc.bohr.life | https://scan.bohr.life | Test BOT |
| BOT Chain mainnet | 677 | https://rpc.botchain.ai | https://scan.botchain.ai | BOT |

Official reference: https://dev-docs.botchain.ai/docs/Developers/quick-guide/

**Critical chain-specific caveat:** Official BOT Chain RPC docs say `eth_getLogs` is disabled on the cited mainnet endpoint: https://dev-docs.botchain.ai/docs/Developers/json-rpc-endpoint/. Do not build Quilt's MVP creator dashboard or success UI by querying historical logs from the official mainnet RPC. Instead, provide `getCreatorSplitIds(address)` and `getSplit(id)` as on-chain view functions, plus per-split `totalPaid` and `paymentCount` state (updated during successful `pay`). Decode **known transaction receipts** directly for payment details. A full historical list of every payment can be added later with a verified third-party indexer or WebSocket ingestion, and must be labeled unavailable until then.

**Architecture:** browser/Next.js frontend ↔ user wallet ↔ BOT Chain RPC ↔ immutable QuiltSplits smart contract; no centralized payment backend, no custodial account, no SQL database required for MVP. No transaction can be simulated as successful; the smart contract is the source of truth.

**Suggested tools:** Next.js + TypeScript + Tailwind + viem/wagmi for the frontend; Solidity 0.8.x (pin an installed stable compiler) and **one** properly configured test/deploy toolchain. Prefer Foundry if it runs reliably in the agent environment; otherwise use Hardhat on Windows/Node, without installing both just for appearances. Pin toolchain dependencies. Use OpenZeppelin ReentrancyGuard or equivalent proven guard. Confirm executable versions rather than guessing versions.

## 2. Five-hour build clock — gated, not just timeboxed

| Elapsed | Phase | What the agent must finish | Exit gate |
| --- | --- | --- | --- |
| 00:00–00:20 | **A. Repo + tooling** | Clone empty GitHub repo safely; initialize README/ignore/env sample, contract & web scaffolding, CI script, chain config | Clean baseline commit on `main`; installs/build scripts run |
| 00:20–01:40 | **B. Contract backend** | Implement immutable splits, payout math, events, views + negative and fuzz tests | Complete local contract tests green; no known fund-safety failure |
| 01:40–02:20 | **C. Backend proof** | Deploy to testnet; use CLI/script to create split and pay it; compare recipient balances; source-verify where supported | Real testnet create/pay receipts + exact payouts; backend independently proven |
| 02:20–03:40 | **D. Frontend and on-chain wiring** | Build Quilt UI on proven contract ABI; wallet switching; create, share, dashboard, pay, confirmations/errors | Independent wallets can complete full testnet frontend flow |
| 03:40–04:20 | **E. E2E and polish** | Mobile QA, chain switch/fee/rejection handling, accessibility, CI green, documentation and critical fixes | Automated checks pass + recorded testnet browser flow |
| 04:20–05:00 | **F. Mainnet release** | Deploy vetted contract mainnet, verify, small-value real create/pay, point production frontend at address, Vercel deploy, final smoke checks and evidence | Genuine confirmed mainnet payout + accessible site; no unresolved critical flaw |

Time slots are targets, not proof of completion. If a gate fails, keep debugging that gate rather than advancing stages. Stop short of mainnet if financial tests are incomplete. For high-value payments, obtain independent review/audit before recommending usage; a five-hour MVP is not an audit.

## 3. Phase A: safely initialize the GitHub project

Live repository was inspected on November 10 and appeared **empty** (no content or branches). For a coding agent working locally in PowerShell:

```powershell
git clone https://github.com/Devendurance/quilt.git
cd quilt
"# Quilt" | Set-Content README.md
git add README.md
git commit -m "chore: initialize Quilt"
git branch -M main
git push -u origin main
```

Use this only if the directory doesn't already contain work; never run `git init`, `git push --force`, or rewrite an existing repository unconditionally. If another agent has already initialized it, `git fetch`/`git pull` and preserve changes. Confirm push authentication before destructive steps. GitHub repository: https://github.com/Devendurance/quilt.

**Target working tree:**

```text
quilt/
  README.md
  .gitignore
  .env.example
  .github/workflows/ci.yml
  contracts/                 # Foundry OR Hardhat, choose one
    src/QuiltSplits.sol
    test/...
    script/Deploy...         # idempotent deployment script
  app/                       # if Next.js at repo root, use app/ directly
    page.tsx
    create/page.tsx
    s/[splitId]/page.tsx
    dashboard/page.tsx
    about/page.tsx
  components/
  lib/
    chains.ts
    quilt-abi.ts
    quilt-addresses.ts
    amounts.ts
    wallet-errors.ts
  scripts/
    smoke-create-pay.ts
  deployments/
    968.json
    677.json
  docs/
    PRD.md
    TRD.md
    architecture.md
    projectplan.md
  .fast-build/STATE.md          # agent state if its skill uses this
```

Do not duplicate a full Next.js `app/` layout inside a separate `web/` unless deliberately choosing a monorepo. Keep the structure as simple as the toolchain supports. The preexisting PRD, TRD and architecture can be copied to `docs/` if available to the agent; don't hallucinate their contents. A fresh agent should read them and reconcile the `eth_getLogs` limitation explicitly.

**`.env.example`:** public RPC/chain IDs and placeholder contract addresses are fine. Never commit real private keys, seed phrases or API secrets. Deployment key can be loaded from a local secret store or ignored environment variable, funded with **only small testing amounts**. The browser frontend does not need a server-side key.

## 4. Phase B: backend contract — precise MVP contract design

Proposed `QuiltSplits.sol` state and interface (adapt syntax to selected compiler):

```solidity
struct Split {
    address creator;
    address[] recipients;
    uint16[] weightsBps; // each positive; sum == 10_000
    uint256 totalPaid;    // total BOT wei ever paid successfully
    uint256 paymentCount;
}

mapping(uint256 => Split) private splits;
mapping(address => uint256[]) private createdSplitIds;
uint256 public nextSplitId = 1;

function createSplit(address[] calldata recipients, uint16[] calldata weightsBps)
    external returns (uint256 splitId);
function pay(uint256 splitId) external payable nonReentrant;
function getSplit(uint256 splitId) external view returns (Split memory);
function getCreatorSplitIds(address creator) external view returns (uint256[] memory);
function quoteSplit(uint256 splitId, uint256 amountWei)
    external view returns (uint256[] memory amountsWei);
```

Recommended events:

```solidity
event SplitCreated(uint256 indexed splitId, address indexed creator);
event RecipientPaid(uint256 indexed splitId, address indexed recipient, uint256 amount);
event SplitPaid(uint256 indexed splitId, address indexed payer, uint256 totalAmount);
```

**Invariants:**

- Exactly 2–5 unique nonzero recipients; `weightsBps.length == recipients.length`; each weight >0; sum exactly 10,000. The creator may be a recipient, with no hidden special privileges.
- New `splitId` monotonically increments; recipient addresses/weights never change after creation. No admin to redirect payouts, no protocol fee, no upgrade.
- `pay` requires existing split and `msg.value > 0`. Compute first `N−1` payouts as `floor(msg.value * bps_i / 10_000)` in integer wei; last gets `msg.value − sum(previous)` to guarantee accounting. Note that for tiny amounts some recipients can receive **0 wei**; don't emit a false claim of having paid a recipient. Prefer reject payments that would calculate a zero share, unless clearly disclosed and explicitly accepted. Decision should be consistent in tests, quote and UI; simplest launch behavior is **reject any payment whose calculated recipient amount is zero**.
- Update `paymentCount`/`totalPaid` only when the transaction succeeds; apply reentrancy guard. Each recipient receives native BOT via a checked `call`; if one rejects, revert the **entire** transaction, not a partial success. Note that contract-recipient compatibility cannot be guaranteed.
- Events must reflect actual amounts; `quoteSplit` and `pay` must share identical allocation logic.
- No custody balance should persist from normal pay calls; no owner withdraw, admin payment privileges or external dependencies.

### Must-run tests (not just happy-path)

| Test group | Minimum cases |
| --- | --- |
| Input validation | 0, 1, 2, 5 and 6 recipients; duplicate address; zero address; empty or mismatched bps; zero bps; 9,999/10,001 total; valid 10,000 |
| Payment | missing split; zero BOT; valid two/three/five-recipient payouts; multiple successive payers |
| Arithmetic | awkward wei amounts; last-recipient remainder; exact sum; reject zero-share dust |
| Atomicity | recipient rejects funds; revert leaves all balances/stats unchanged |
| Security | malicious receiver tries to re-enter; failure can't steal funds; no owner/admin drain |
| Events/views | `SplitCreated`/`RecipientPaid`/`SplitPaid` values, `getSplit`, `getCreatorSplitIds`, counters |
| Property/fuzz | For all successful payouts, sum recipient deltas equals `msg.value`; only approved recipients receive native payouts |

Contract must compile without warnings suggesting dangerous behavior. Run static analysis if available and helpful, but never treat a quick automated scan as an audit.

### Backend completion report required

Agent must provide contract file path, exact toolchain and compiler version, test count/output, a short vulnerability/edge-case assessment, the ABI export location and any known limitations. **No frontend integration starts without this report and the Phase C live testnet proof.**

## 5. Phase C: testnet backend smoke test with no frontend

A standalone command/script should do the following via testnet RPC and an intentionally low-value funded test wallet:

1. Call `eth_chainId` and assert **968**; check contract bytecode after deployment.
2. Deploy `QuiltSplits` to Bohr testnet; record address, deployment tx hash, chain ID and compiler settings.
3. With creator wallet A, call `createSplit([B,C], [6000,4000])` and wait for a successful receipt; derive actual `splitId` from emitted event or on-chain state.
4. Read `getSplit`; assert recipients/weights and creator match.
5. With independent payer wallet D, send a small known amount of tBOT via `pay(splitId)`; decode successful receipt and assert event amounts.
6. Compare recipient B/C balances immediately before/after using block-scoped reads when available, ensuring recipient allocations match exactly and `totalPaid`/`paymentCount` update correctly. Accounts B/C should not themselves send a transaction during the measured interval.
7. Exercise at least one negative path (zero value or invalid ID) and verify it reverts.
8. Save a `deployments/968.json` artifact containing verified **real** address, txs, chain ID, test run command, contract hash/ABI reference and test timestamps.

No testnet faucet amount or receipt can be presumed successful until demonstrated. Obtain test BOT from `https://faucet.botchain.ai` if needed, and use a purpose-built low-value deployer wallet rather than an important personal wallet.

**Gate:** local tests green **plus** a real on-chain create/pay receipt and exact recipient proof. Only then is backend ready for UI wiring.

## 6. Phase D: frontend implementation on the verified backend

The frontend must speak to `QuiltSplits` through the exact ABI and environment-scoped deployed address, using `viem`/`wagmi`. Avoid dummy payment figures except clearly labeled static examples on the marketing landing page.

### Routes and user experience

| Route | Mandatory functionality |
| --- | --- |
| `/` | Distinct Quilt brand, “one payment, fair shares” value proposition, sample diagram, CTAs, clear mainnet chain mention and FAQ snippet. |
| `/create` | Connect wallet, chain switch, 2–5 recipient rows, percentage editor, exact sum, invalid-address messages, gas check, immutable warning, create signature, pending/receipt/success. |
| `/s/[splitId]` | Read canonical on-chain split, creator/recipient abbreviations and copy, exact BOT quote, wallet connect, payer transaction, explorer receipt, read-only availability without connected wallet. |
| `/dashboard` | Creator-owned splits via `getCreatorSplitIds`; per-split amounts paid/payment count using state reads, share button, empty state. **No historical payment list unless an indexer exists.** |
| `/about` or `/help` | What the contract does, risks, gas, irreversible settlement, contract-recipient failure, support and official explorer. |

**UX acceptance:**

- Fresh incognito browser can open a split link and read the split without connecting a wallet.
- Supported wallet can connect; wrong-chain account gets switch/add network flow. Writes are blocked unless on 677 in mainnet build (968 in test build).
- Split form prevents invalid percentage totals and shows a clear irreversible-allocation disclaimer.
- Payment preview is computed from the **on-chain quote** or an exactly mirrored `bigint` calculation. No JS floating point for token wei.
- `pay` passes native BOT as transaction `value`. Never approve ERC-20s or call DEX contracts.
- Wallet rejected/pending/failed/successful states are distinguishable. After a success, `getSplit` is refetched and tx explorer URL displayed.
- Mobile 360px viewport, buttons accessible, text legible, no overflow, no inert controls. Visual design is polished but does not compete with accurate money information.
- Footer displays BOT Chain name/logo and both URLs exactly: `https://botchain.ai`, `https://scan.botchain.ai`.

### Browser flow proof

Real testnet: Wallet A creates → share link opens in private browser → Wallet D pays → confirmed receipt → recipients B/C get correct amounts → `/dashboard` shows updated total and count. Record screenshots/short video and tx hashes. A beautiful mock UI alone is a failed gate.

## 7. Phase E: quality, CI and security review

**Automated commands, selected for actual stack:** contract formatter/build/test/fuzz, lint, TypeScript check, production Next.js build, a CI workflow that repeats those checks, and at least one scripted RPC/contract integration test. Run checks once after each substantive slice, fix failures, and avoid redundant loops.

**Manual adversarial checks:**

1. Create a split with invalid address, duplicates, 99% total, 101% total and >5 recipients.
2. Open a split in incognito; examine actual contract address/recipient data.
3. Connect wrong chain; confirm write is blocked.
4. Reject wallet transaction; confirm no fake success.
5. Attempt payment without enough gas; show comprehensible error.
6. Pay two different amounts; confirm integer-wei allocations and counters.
7. Use a receiver contract that rejects BOT; whole payment reverts and counters stay unchanged.
8. Refresh during pending tx; app must recover from tx hash or on-chain state rather than claim success prematurely.
9. Verify `.env`/secrets absent from git; inspect production bundle for leaked deployer key.
10. Verify no route, animation, graph or CTA is a nonfunctional placeholder masquerading as product capability.

**Launch blocker:** any incorrect payout, untested recipient failure/reentrancy behavior, unverified contract, wallet sending value to wrong address or false confirmation. These are non-negotiable even if time runs out.

## 8. Phase F: mainnet and Vercel launch

**Mainnet preflight:**

- Confirm 677 through live `eth_chainId` and correct independent network config. Confirm available mainnet BOT for contract deployment, smoke payments and gas (not test BOT).
- Re-run full contract test suite against the exact compiled source to deploy. Compare bytecode/hash/ABI artifacts. Review recipient behavior and payout logic.
- Use secure minimal-funds deployer; never commit, log or paste a private key into chat. Avoid permanent deployer permissions; V1 should have no admin custody role.
- Deploy to chain 677, verify contract source and confirm code exists via `eth_getCode`. Record exact address and deployment tx.
- Create a small genuine mainnet split and pay it from a different real wallet; independently verify recipient balance changes, emitted events and on-chain `paymentCount`/`totalPaid`.
- Set **mainnet-specific** contract address in public environment config and deploy website. Fail closed if unset (never silently fall back to testnet).
- Perform production smoke through actual browser wallet on the public URL; check footer, support, privacy and explorer links.
- Pin deployment commit and public ABI/contract in README; publish real mainnet announcement only after verified live success.

**Submission + continued operation:** create independent X account and at least five valid substantial posts within preceding 30 days, plus explicit mainnet launch announcement; monitor site and known contract read; keep functioning through the following week. Collect actual three-wallet/five-interaction evidence only from meaningful independent user use. Mary's seven criteria and public BOT support program are separate; get written eligibility/payment clarification.

**Do not invent:** production domain, contract address, X handle, test logs, real users, verified payouts or deployment success. Fill all placeholders from actual execution.

## 9. Go/no-go decision framework

**GO** only if: contract tests green; testnet create/pay verified; mainnet contract code and source verified; mainnet payout succeeds; UI confirms only after receipt; project site and social launch evidence exist; no unresolved fund-safety issue.

**NO-GO / continue testing** if: funds can misroute/trap unexpectedly, validation can be bypassed, receiver reentrancy is untested, wallet chain is ambiguous, contract sources cannot be verified, tests fail, no honest mainnet smoke exists. Ship the frontend as a preview if needed, but do **not** call it an operational payment DApp.

## 10. Launch artifact / proof checklist

Maintain `docs/LAUNCH_EVIDENCE.md` with these actual entries (initially `PENDING`):

| Evidence | Value |
| --- | --- |
| GitHub main commit | `PENDING` |
| Contract source version and tests | `PENDING` |
| Testnet contract / create / payment hashes | `PENDING` |
| Mainnet chain ID | `677` |
| Mainnet deployed + verified contract address | `PENDING` |
| Mainnet createSplit and pay tx hashes | `PENDING` |
| Recipient balances before/after + event breakdown | `PENDING` |
| Website URL + Vercel deployment | `PENDING` |
| X account + 5 posts + explicit mainnet launch post | `PENDING` |
| Genuine wallet participation and Mary's interpretation | `PENDING` |
| Support contact, uptime monitor and owner | `PENDING` |

### Required agent reporting format for every slice

```text
SLICE: A/B/C/D/E/F
STATUS: PASS / BLOCKED / PARTIAL
COMMIT: <actual SHA or NOT COMMITTED>
FILES CHANGED: <paths>
EXECUTED TESTS: <commands and actual results>
ON-CHAIN EVIDENCE: <network, actual contract/tx IDs or NONE>
RISKS / UNFINISHED: <specific issues>
NEXT SLICE: <one bounded next job>
```

**Final reminder:** Scope is deliberately tight so the product can be finished rather than half-built. Backend-first does not mean adding an unnecessary database/API; for Quilt the backend **is the smart contract plus tested RPC/deployment integration**. No frontend gets wired to a payment mock pretending to be real.
