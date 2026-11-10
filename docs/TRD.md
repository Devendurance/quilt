# Quilt — Technical Requirements Document (TRD)

**Status:** Build specification v1.0 · **Date:** 2026-11-10 · **Contract target:** BOT Chain mainnet 677

## 1. Technical objective and scope

Deploy a minimal, independently verified EVM contract and a production frontend that allow creation of immutable recipient-weight splits and atomic native-BOT distribution. There must be **no centralized custody**, no owner ability to edit recipient weights, and no hidden payment routing. The client must source authoritative split data from chain, never trust cached metadata over a contract read.

### Network configuration

| Environment | Chain ID | RPC | Explorer | Native asset |
| --- | ---: | --- | --- | --- |
| Bohr testnet | `968` | `https://rpc.bohr.life` | `https://scan.bohr.life` | Test BOT |
| BOT mainnet | `677` | `https://rpc.botchain.ai` | `https://scan.botchain.ai` | BOT |

Check `eth_chainId` at runtime. Verify the RPC endpoint and chain IDs before shipping. Contract addresses are environment-specific and must never silently fall back from mainnet to testnet.

## 2. Recommended implementation stack

- **Frontend:** Next.js App Router + React + TypeScript + Tailwind; `wagmi` and `viem` for account/chain, simulations, writes and receipt tracking.
- **Contract:** Solidity `^0.8.24` with a pinned Foundry toolchain and a pinned OpenZeppelin Contracts 5.x `ReentrancyGuard` dependency. Prefer one compact `QuiltSplits` contract over unnecessary factories/proxies.
- **Data:** on-chain split facts/events are canonical. Optional DB stores non-authoritative title/slug and lightweight telemetry; do **not** make a DB required for payouts.
- **Deployment:** static/SSR app on an independently configured Vercel project; public read-only RPC access plus wallet signer for writes.
- **CI:** formatting, typecheck, lint, contract build/tests and frontend build.

## 3. Contract interface — proposed

```solidity
struct Split {
    address creator;
    address[] recipients;   // length 2..5
    uint16[] weightsBps;    // each >0; total 10_000
    bool exists;
}

function createSplit(
    address[] calldata recipients,
    uint16[] calldata weightsBps
) external returns (uint256 splitId);

function pay(uint256 splitId) external payable nonReentrant;
function getSplit(uint256 splitId) external view returns (Split memory);
function splitCount() external view returns (uint256);

event SplitCreated(uint256 indexed splitId, address indexed creator);
event SplitPaid(uint256 indexed splitId, address indexed payer, uint256 totalAmount);
event RecipientPaid(uint256 indexed splitId, address indexed recipient, uint256 amount);
```

**Implementation invariants:**

1. `createSplit` rejects mismatched array lengths, counts outside 2–5, `address(0)`, duplicates and nonpositive or non-10,000-bps weights.
2. Store addresses/weights exactly once; no owner-only modification or upgrade route in V1.
3. `pay` requires an existing split and `msg.value > 0`; compute first N−1 amounts as `msg.value * weight / 10_000`; final recipient receives `msg.value − sum(previous)`.
4. Use `nonReentrant`, revert on a failed recipient call, and emit events **only after a fully successful payout** (transaction reverts events as well if any transfer fails). No `transfer`/`send` assumption with fixed stipend; use checked low-level `call` with return-status validation.
5. No contract balance should remain from normal `pay` flows; unsolicited transfers/forced BOT are not a payout balance and must not be erroneously exposed as withdrawable user funds.
6. No owner rescue method for user payments; no platform fees.

**Tradeoff recorded:** Atomic push payments mean recipient contracts that reject native transfers can block a payment. Do not quietly switch to claimable balances without updating PRD, trust model and acceptance criteria.

## 4. Client data types and UI/chain workflow

```ts
type DraftSplit = {
  recipients: Array<{ address: `0x${string}`; weightBps: number }>;
  title?: string; // optional non-canonical metadata
};
type SplitView = {
  id: bigint; creator: `0x${string}`;
  recipients: `0x${string}`[]; weightsBps: number[];
};
type PaymentState = 'idle'|'simulating'|'awaiting-wallet'|'pending'|'confirmed'|'failed';
```

1. Validate form locally **and** rely on contract validation.
2. Read chain and account; switch to chain 677 for all mainnet writes.
3. Call `simulateContract` with `account`, ABI, exact wei and expected ID before wallet prompt; simulate and estimate gas when supported.
4. Write transaction with `writeContract`, record hash, wait for a successful receipt (not merely transaction submission), and decode `SplitCreated`/`SplitPaid` logs from the actual contract address.
5. Read `getSplit` to render canonical details on the share page. Preview `value * weightBps / 10000` using `bigint`, with final-recipient remainder identical to Solidity.
6. Verify the explorer link is `https://scan.botchain.ai/tx/{hash}`; distinguish revert from pending and user rejection.

### Page-level responsibilities

- `/`: explains one payment / many recipients, example and direct CTA.
- `/create`: wallet gate, addresses, editable weights, validation, simulation and publish confirmation.
- `/s/[splitId]`: public read-only split metadata, payer amount input, confirmation, explorer evidence and copy-link action.
- `/about`: transparent limitations, trust model and operating contact.

## 5. Security, privacy and abuse controls

| Risk | Required control |
| --- | --- |
| Reentrancy via recipient contract | `nonReentrant`; test malicious fallback that attempts nested `pay`. |
| Recipient rejection / call failure | Revert the full payment; UI displays no partial-settlement claim. |
| Rounding error | Deterministic last-recipient remainder; fuzz sum(outputs) == msg.value. |
| Duplicate or zero addresses | Validate client and contract. |
| Fake success | Mark confirmed only after receipt status success and matching contract event. |
| Network confusion | Chain ID preflight; environment-scoped addresses; never assume chain by wallet name. |
| Impersonation / malicious share link | Resolve actual recipients on-chain and show them before payer signs. |
| UI metadata tampering | No impact on canonical allocations; sanitize user-created titles. |
| PII / private keys | No key collection, seed phrases, sensitive logging or wallet secret in frontend. |

## 6. Nonfunctional requirements

- Mobile-first wallet UX, accessible focus states, no horizontal overflow at 360px.
- Public split pages should render read-only even without wallet connection.
- No backend availability dependency in the core `pay` flow.
- Gracefully handle slow RPC, contract read errors, stale wallet session and RPC disagreement.
- Keep secrets only in server runtime; publish contract addresses, build commit and deploy tx publicly.
- Add public uptime check for `/` and `/s/{knownId}` plus error reporting without storing unnecessary wallet-to-person identity mappings.

## 7. Test matrix

**Foundry tests:** valid 2/5 recipients; 1- and 10,000-bps extremes where admissible; sum!=10,000; duplicate/zero; empty/overlong arrays; 0-value payment; missing split; nonpayable/contract recipient revert; malicious reentrancy; arbitrary wei values with all shares summing exactly; emitted event values; invariant: distribution total equals `msg.value`.

**Integration:** create and pay on testnet; custom mainnet chain addition; wallet reject; wrong chain; insufficient BOT; extra gas; explorer link; reload fresh browser public link; contract-source verification; unsuccessful tx never shown as success.

**Acceptance gate:** no P0 if contract tests fail, gas estimates are unavailable without a user-facing fallback, or a test payment produces an incorrect allocation.

## 8. Configuration / deployment outputs

```bash
NEXT_PUBLIC_BOT_CHAIN_ID=677
NEXT_PUBLIC_BOT_RPC_URL=https://rpc.botchain.ai
NEXT_PUBLIC_QUILT_CONTRACT_ADDRESS=<fill-after-verified-deploy>
# DEPLOYER_PRIVATE_KEY is local/CI secret only; NEVER NEXT_PUBLIC_
```

Deployment artifacts must include ABI JSON, compiler and optimizer settings, chain ID, bytecode hash, deploy tx hash, verified source URL, test results and deterministic reproduction notes. Confirm official explorer's current verification interface (Blockscout-style) rather than assuming Etherscan tooling compatibility.

**Primary references:** [BOT Chain quick guide](https://dev-docs.botchain.ai/docs/Developers/quick-guide/), [OpenZeppelin ReentrancyGuard](https://docs.openzeppelin.com/contracts/5.x/api/utils), [viem receipt API](https://viem.sh/docs/actions/public/getTransactionReceipt).
