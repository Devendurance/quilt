# Real wallet QA (manual)

Automated runs in Slices D and E used a local dev signer, which is not real wallet evidence. No browser wallet extension was reachable from the agent environment, so these steps need a person with MetaMask (or another EIP-1193 wallet). Use two disposable wallets, A (creator) and B (payer), each holding a small amount of test BOT from https://faucet.botchain.ai. Never import a funded mainnet account.

## Setup

1. Add the network in the wallet: name Bohr Testnet, chain ID 968, RPC https://rpc.bohr.life, symbol tBOT, explorer https://scan.bohr.life.
2. Open the deployed site (or `npm run dev`). Don't set `NEXT_PUBLIC_DEV_WALLET_URL`.

## Steps and expected results

| # | Action | Expected |
| --- | --- | --- |
| 1 | Click Connect wallet with wallet A | Wallet prompt, then the header shows the short address |
| 2 | Click the address to disconnect, reload | Header shows Connect wallet again |
| 3 | Connect again | Connects without errors |
| 4 | Switch the wallet to another chain, for example Ethereum | A "Switch to Bohr Testnet" button appears and pay/create stay unusable |
| 5 | Click the switch button | Wallet shows a switch or add-network prompt, then the button disappears |
| 6 | /create with wallet A: 3 recipients, 50/30/20, Review split | Review lists the exact addresses and shares and says they can't be changed |
| 7 | Tick the acknowledgment, click Create split permanently, sign | States go awaiting wallet, pending with explorer link, then "Split #N is live". Record the tx hash |
| 8 | Open /s/N in a fresh browser profile with no wallet | Page loads with recipients, 0 paid, 0 payments, Connect wallet to pay |
| 9 | Connect wallet B, enter 0.0005, check the preview | Exact per-recipient amounts and an estimated network fee appear |
| 10 | Click Pay and reject in the wallet | Rejected state, nothing sent, totals unchanged |
| 11 | Click Pay again and approve | Pending, then "Paid. Confirmed and verified on-chain" with the payouts list. Record the tx hash |
| 12 | Enter 0.000000000000000001 (1 wei) | "That amount is too small" and the pay button stays disabled |
| 13 | Use wallet C holding slightly more than the amount but less than amount plus fee | A balance message that includes the estimated network fee, pay disabled |
| 14 | Open the dashboard with wallet A | Split N listed with total paid and payment count matching the contract |
| 15 | Repeat steps 6 to 11 on a phone, or a 375px viewport | No horizontal scroll, addresses readable, buttons tappable |

## Record

For each step write pass or fail. Attach the create and pay tx hashes and check both on https://scan.bohr.life/tx/{hash}.
