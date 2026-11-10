# Quilt — Delivery and Launch Project Plan

**Plan date:** Tuesday, 2026-11-10 · **Deadline:** Friday, 2026-11-13 · **Usage follow-through:** November 14–20  
**Deployment target:** BOT Chain mainnet, chain ID 677 (separate Bohr testnet, chain ID 968).
**Execution rule:** One narrowly scoped vertical slice at a time; ship tested real payout functionality before marketing polish.

## 1. Scope boundary

**Must ship:** immutable split creation, public payment link, native BOT atomic payment, wallet/chain UX, receipts, verified source, independent site and X presence.  
**Must defer:** tokens, mutable splits, stablecoins, recurring payouts, admin controls, cross-chain, complex analytics.  
**Important:** This plan assumes a developer/agent can execute and test in parallel with the other two projects. Times are targets, not verification that tasks are finished.

## 2. Critical path and milestones

| Window (Nigeria/WAT) | Deliverable | Gate / proof |
| --- | --- | --- |
| **Nov 10 — Setup + contract** | Independent repo, BOT Chain config, initial landing, `QuiltSplits` implementation, unit tests | Valid split + atomic pay tests; no test failures; first two substantive X posts |
| **Nov 11 — Full UX** | Wallet connect, create form, read-only split page, amount preview, real testnet transaction | Fresh-browser testnet create → pay → explorer proof; 1 additional X update |
| **Nov 12 — Release candidate** | Security edge tests, mobile UX, deployment script, mainnet small-value payment rehearsal | Test logs, verified mainnet contract source, rollback plan for frontend, 1 X update |
| **Nov 13 — Launch** | Final public URL, production QA, launch announcement, Mary evidence dossier | Mainnet create/pay demonstrated, announcement explicitly says mainnet launch; fifth substantive post total |
| **Nov 14–20 — Operate** | Monitor, fix UI bugs, help real teams onboard, record genuine interactions | Independent wallet and activity evidence; support updates; Mary's acceptance after valid window |

## 3. Task board (agent-ready)

### P0-A: contract implementation

- [ ] Initialize Foundry project; pin compiler/OpenZeppelin versions; set testnet/mainnet RPC env.
- [ ] Implement `createSplit` validation, append-only canonical data and `SplitCreated` event.
- [ ] Implement `pay` with `nonReentrant`, integer rounding and atomic native-BOT payouts.
- [ ] Add unit/fuzz tests for arrays, weights, rounding, malicious recipient, reentrancy and zero value.
- [ ] Build deploy/verify script; publish ABI and verify explorer source.

**Done when:** local tests green and testnet successful payouts match expected wei exactly.

### P0-B: vertical product flow

- [ ] Build distinct Quilt brand shell (not Wink/Trail template) and BOT Chain footer links.
- [ ] Add wallet connect, wrong-chain UX, connected account state and balance read.
- [ ] Build split editor, exact basis-point sum validator and contract transaction flow.
- [ ] Build public `/s/{id}` reading contract data on a fresh browser.
- [ ] Build amount preview, gas disclaimer, pay action, receipt tracking and explorer link.
- [ ] Test actual wallet rejection, revert, insufficient balance and RPC downtime.

**Done when:** two unrelated wallets can create and pay a split without developer assistance.

### P0-C: launch and eligibility operations

- [ ] Establish independent X account, five substantive posts in 30 days and a dedicated URL.
- [ ] Verify footer displays BOT Chain name/logo + both official links.
- [ ] Mainnet deploy, verify, run small-value test and record actual tx hashes.
- [ ] Publish explicit project-authored announcement: "Quilt has officially launched on BOT Chain mainnet" (only after confirmed live).
- [ ] Obtain honest permissioned usage from actual teams; do not manufacture payments.
- [ ] Send Mary working URL, social links, explorer proof and operator contact.
- [ ] Monitor availability and wallet flow after launch.

## 4. Exit criteria and release blocker policy

**Hard blockers:** Any wrong recipient amount, failed contract validation, reentrancy exploit, recipient-failure partial state, wrong chain, no successful mainnet pay, broken public page, misleading confirmed state or absent verified contract source.  
**Soft issues:** Minor animation, non-essential sorting, optional title persistence or imperfect social preview. Defer without blocking a safe launch.

## 5. Proof and QA log template

| Field | Fill from real execution |
| --- | --- |
| Live website and deployment commit | `TBD` |
| Mainnet contract and verification URL | `TBD` |
| Creator wallet / `createSplit` tx | `TBD` |
| Independent payer wallet / `pay` tx | `TBD` |
| Recipient addresses and expected/actual wei | `TBD` |
| Site/X announcement and fifth post link | `TBD` |
| Mary eligibility decision and notes | `PENDING` |

Do not prefill explorer links or mark tests as complete unless executed.

## 6. Dependencies, risk and mitigation

| Risk | Effect | Response |
| --- | --- | --- |
| Not enough time for full security tests | Contract risk | Cut optional features; never cut payout correctness tests. |
| Recipient contract rejects BOT | Payment reverts | Clear message; encourage compatible recipients, log failure. |
| BOT gas/test funds unavailable | Cannot demonstrate | Acquire testnet and a small independently funded mainnet balance early. |
| Mary's interaction interpretation differs | Eligibility disputed | Get written ruling on valid create/pay actions before launch. |
| Similarity with Wink | Independence at risk | Separate repo, UI identity, contract model, social presence and primary function. |
| Frontend/RPC outage | Operational criterion at risk | Health checks, support contact, incident notes, verified alternative RPC plan. |

## 7. Agent handoff prompt

> Build Quilt as a distinct native-BOT multi-recipient atomic payout DApp on BOT Chain. Follow `PRD.md` for scope and acceptance, `TRD.md` for contract invariants and tests, and `architecture.md` for trust boundaries. Inspect the actual repo first, reuse existing working modules, preserve unrelated changes, and deliver one tested vertical slice before adding extras. Do not claim success without real receipt evidence. Record changed files, commands/tests run, deployment addresses, unresolved issues and the next slice.

**Related documents:** [`PRD.md`](./PRD.md), [`TRD.md`](./TRD.md), [`architecture.md`](./architecture.md).
