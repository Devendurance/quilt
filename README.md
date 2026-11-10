# Quilt

Native-BOT split payments on BOT Chain. A creator defines one immutable split
(2-5 recipients, weights totaling exactly 10000 bps); any payer settles every
share with a single native BOT transaction. No fees, no custody, no admin drain.

## Chains

| Environment | Chain ID | RPC | Explorer |
| --- | --- | --- | --- |
| Bohr testnet | 968 | https://rpc.bohr.life | https://scan.bohr.life |
| BOT Chain mainnet | 677 | https://rpc.botchain.ai | https://scan.botchain.ai |

Mainnet RPC disables `eth_getLogs`: dashboards read on-chain views
(`getCreatorSplitIds`, `getSplit`, `totalPaid`, `paymentCount`), never log history.

## Quickstart

```bash
npm install
npm run dev        # frontend
npx hardhat compile
npx hardhat test   # contract suite (Slice B adds it)
```

Copy `.env.example` to `.env` for local deploys. Contract addresses stay empty
until a verified deploy writes them; the app fails closed when unset.

## Repo layout

- `contracts/` Hardhat project (`src/`, `test/`, `script/`). Compiler: Solidity 0.8.28.
- `src/app/` Next.js pages. `src/lib/` chain config + contract address resolution.
- `scripts/` repeatable testnet CLI proof (Slice C). `deployments/` real deploy evidence.
- `docs/` PRD, TRD, architecture, project plan (Slice A baseline; Slices B-F append evidence).
- `docs/LAUNCH_EVIDENCE.md` ships in Slice F with real hashes only. Nothing is
  launched, deployed, or verified until its slice reports actual output.

## Build order (backend first)

A repo/tooling, B contract+tests, C testnet CLI proof, D frontend/wallet,
E QA, F mainnet/prod. No frontend contract wiring before the Slice C gate.
See `.fast-build/STATE.md` for the live checkpoint (local only, not committed).
