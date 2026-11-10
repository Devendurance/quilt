# Quilt — Product Requirements Document (PRD)

**Document status:** Implementation-ready draft v1.0 · **Date:** 2026-11-10  
**Product name:** Quilt (locked; formerly SplitNest) · **Network:** BOT Chain mainnet (chain ID 677)  
**Owner:** Project team · **Launch target:** 2026-11-13 · **Source of truth:** this PRD plus `TRD.md`, `architecture.md`, and `projectplan.md`.

> **Positioning statement (proposed, not approved brand messaging):** Quilt gives collaborators one reliable place to define how incoming BOT is shared, so one payment settles everyone's agreed share. Quilt is a standalone payment-splitting product, not a gifting product.

## 1. Problem and opportunity

Small creator teams, hackathon collaborators and project contributors often receive one joint payout into one wallet. Someone must manually calculate everyone else's share, make multiple transfers and defend the arithmetic. That is avoidable operational work and a recurring source of mistrust. BOT Chain can offer an EVM-native, transparent alternative that is useful on a normal working day, not just during a campaign.

**Job to be done:** "When our team receives BOT, let us publish an unchangeable split so anyone can pay once and see every recipient's allocation happen on-chain."

### Target users and use cases

| User | Trigger | Desired outcome |
| --- | --- | --- |
| Hackathon collaborators | Prize or milestone income | Settle the agreed 50/30/20 arrangement transparently. |
| Creators and production teams | Support or gig income | Share payment with editors/designers without handling several transfers. |
| Small Web3 project teams | Community or customer payments | Provide one canonical link showing who receives each share. |

**Differentiation:** This is a fixed, verifiable multi-recipient payout primitive. It is **not** invoicing, subscriptions, treasury custody, escrow, token launching, or Wink's personalized gifting flow.

## 2. Goals and measurable success

1. A new user can create a permanent split of **2–5 unique recipients** and share its link.
2. A payer can fund an existing split with native BOT in **one wallet-approved transaction**; all intended recipient payments occur atomically.
3. The page accurately displays recipients, percentages, predicted allocation and transaction receipts.
4. The interface works on a phone and desktop with a standard EVM wallet, rejects wrong-network writes and explains network/gas requirements.
5. The project has independent public presence and can demonstrate genuine product use to Mary, with no manufactured activity.

**MVP success signal:** At least one real team split is created and successfully paid on mainnet, with readable recipient allocations and an explorer transaction URL. For Mary's verification, target **≥3 distinct genuine wallets and ≥5 valid core create/pay interactions within 7 days of launch**; which actions count requires Mary to confirm.

## 3. Product scope

### P0: required before announcing mainnet launch

| ID | Requirement | Acceptance criterion |
| --- | --- | --- |
| Q-P01 | Connect wallet and detect BOT Chain | UI displays account and chain; prompts switch/add network 677. No write while wrong chain. |
| Q-P02 | Create a split | Authenticated wallet submits 2–5 nonzero, distinct addresses with shares totaling exactly 10,000 basis points (100%). |
| Q-P03 | Publish immutable record | Contract assigns `splitId`; recipient weights never change after creation; explorer shows `SplitCreated`. |
| Q-P04 | Share split link | `/s/{splitId}` loads on a new device without creator session and shows canonical on-chain data. |
| Q-P05 | Pay split in BOT | Payer selects amount; `pay(splitId)` forwards native BOT atomically, emits `SplitPaid`, and provides receipt. |
| Q-P06 | Display exact preview | Contract and UI use same integer-wei rounding: recipients 1…N−1 get floor of share; last gets remainder. |
| Q-P07 | Transaction states and errors | Shows idle, wallet requested, pending, confirmed or failed; handles rejected signatures, RPC issues, zero amount and insufficient balance. |
| Q-P08 | Independent project presence | Dedicated website and X account; footer names BOT Chain and links to `https://botchain.ai` and `https://scan.botchain.ai`. |
| Q-P09 | Mobile accessibility | Readable payment form, address copy and share controls on a narrow phone screen; keyboard accessible. |

### P1: only after the launch is stable

- List splits created by a wallet, basic payout history, reusable social preview images.
- Optional stablecoin/ERC-20 splitting after safe transfer logic and decimals are separately tested.
- Team templates or contact book, with explicit consent for stored labels.

### Explicit non-goals

- No edits to a published split, admin takeovers, fee deductions or token issuance.
- No streaming, fiat settlement, cross-chain payouts, chargebacks or arbitration.
- No guarantee that recipient contracts can accept native BOT; the UI must disclose when the whole transaction reverts.

## 4. User journey and UX rules

**Create:** Landing page → Connect wallet → Set two to five wallet addresses and percentages → Live preview → Confirm immutable split → Contract confirmation → Public split page + copyable link.

**Pay:** Open shared page → Review recipients and amounts → Enter BOT amount → See gas explanation → Wallet confirmation → Pending state → Confirmed transaction and recipient breakdown.

**Screens/routes:** `/` discovery + primary CTA; `/create` split builder; `/s/[splitId]` public canonical split and payment; `/activity` optional read-only list for connected wallet; `/about` FAQ and risks.

**Microcopy principles:** Say "split payment" and "recipient" rather than "investment" or "deposit." Warn before creation that shares cannot be changed. Only use "Paid" after a successful confirmed receipt. Show native BOT amounts and gas separately.

## 5. Rules and edge cases

- Exactly 2–5 distinct nonzero recipient addresses; weights positive and sum exactly to `10_000` bps; creator may be a recipient if disclosed.
- Reject `msg.value == 0`, invalid split IDs, and malformed input. No platform fees in V1.
- Integer wei rounding: calculate first N−1 shares with integer division and send the leftover to the last address; preview must match.
- Native BOT is the **only** supported asset. Show precise denomination and balance.
- Atomicity: if any recipient rejects BOT, the entire payment reverts. Explain why; never display a partial success.
- Every transaction prompts an EVM wallet and requires BOT for gas; do not claim gas sponsorship.
- Public wallet addresses and percentages are permanently visible. Optional labels must not be treated as private.

## 6. Mary's project eligibility — independent evidence

Mary's seven checks are an additional delivery acceptance layer, not a promise of the public ecosystem program's funding. Quilt needs its **own** X account (at least five substantive posts in the previous 30 days), a project-authored launch announcement explicitly stating **"officially launched on BOT Chain mainnet"**, a working DApp with footer links, one genuinely usable core action, independence from Wink and Trail, real on-chain use, and continuing operations. The seven-day usage window starts at the actual launch timestamp; a Nov 13 launch implies follow-through through approximately Nov 20.

**Evidence package:** working URL, X account/posts, launch URL, chain ID, verified contract address, deployment tx hash, `SplitCreated` and `SplitPaid` transactions, anonymized tester evidence/permission, public monitoring endpoint, and a concise demo video. Do not count fake, self-referential or coordinated volume as adoption.

## 7. Decisions and dependencies

- **Decided:** Quilt is independent; native BOT only; immutable split allocation; fixed 2–5 recipients; no fees; atomic payout.
- **To confirm with Mary:** whether split creation and recipient payments count individually toward valid core interactions, exact review cutoff, compensation and support window.
- **To supply:** final brand visual assets, X handle, production domain, deployer account, small BOT test budget, independent pilot users.
- **Risk ownership:** contract engineer signs off payout tests; product owner signs off copy and demo; operator signs off site uptime and public activity.

## 8. Release acceptance checklist

- [ ] `createSplit` and `pay` pass unit, fuzz, reentrancy and failure-path tests.
- [ ] At least one end-to-end successful payment on testnet, then a small real mainnet payment with a confirmed receipt.
- [ ] Correct balances/rounding and explorer URLs verified independently.
- [ ] Wrong chain, rejected wallet request and failed recipient payment have coherent UI states.
- [ ] All P0 screens load publicly on mobile, plus verified contract and footer links.
- [ ] Mary evidence dossier is complete; post-launch monitoring and support owner assigned.

**References:** [BOT Chain quick guide](https://dev-docs.botchain.ai/docs/Developers/quick-guide/), [official explorer](https://scan.botchain.ai), [contract verification](https://scan.botchain.ai/contract-verification). Product assumptions originated in the previous SplitNest concept brief; final brand name is now Quilt.
