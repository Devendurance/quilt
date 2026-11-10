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
npx hardhat test   # 24 contract tests + frontend integrity tests
npm run typecheck && npm run typecheck:contracts && npm run lint && npm run build
```

Copy `.env.example` to `.env` for local deploys. The app fails closed when a
contract address is unset. The Bohr testnet address defaults from
`deployments/968.json`. Mainnet (677) never falls back to it.

## Deploying the website (Vercel, Bohr testnet)

- Framework: Next.js. Install: `npm ci`. Build: `npm run build`. Root: repo root.
- Env (all public, no secrets): `NEXT_PUBLIC_QUILT_NETWORK=968` and
  `NEXT_PUBLIC_QUILT_CONTRACT_ADDRESS_968=0xdc7effbb316a9a194c2779d33d28d0fa3347fb7e`
  (both optional, these are the defaults).
- Never set `DEPLOYER_PRIVATE_KEY`, `PAYER_PRIVATE_KEY` or `NEXT_PUBLIC_DEV_WALLET_URL` on Vercel.
  The dev signer only loads when `NODE_ENV` is `development`, and `npm run check:prod-bundle` verifies a build.
- Mainnet writes stay off until Slice F: `NEXT_PUBLIC_QUILT_NETWORK=677` needs its own
  `NEXT_PUBLIC_QUILT_CONTRACT_ADDRESS_677` and `NEXT_PUBLIC_QUILT_MAINNET_WRITES=true`.
- The frontend tsconfig covers `src/` only. Contract and test types live in `tsconfig.hardhat.json`
  (`npm run typecheck:contracts`), so a Vercel build needs no Hardhat artifacts.

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
