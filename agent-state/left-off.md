# left-off.md

- Doing: 5-hour backend-first MVP, slices A-F in order.
- Done: A-D. Slice E hardening done in code (receipt verification, chain config, dev signer gating, tsconfig split, mobile fixes).
- Blocked in E: real MetaMask/EIP-1193 extension QA. No wallet extension reachable from the agent, so the user must run the manual steps in docs/WALLET_QA.md.
- Next: user deploys site to Vercel (testnet), runs manual wallet QA, then Slice F (mainnet) only after BOT funding and gates.
- Issues: ports 3000 and 3100 are used by other projects (wink, trail). Use 3210 for Quilt dev. Never force-push.
