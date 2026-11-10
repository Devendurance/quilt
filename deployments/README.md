# deployments/

Real deployment evidence lives here. Each file is written by its slice from actual
execution output, never hand-filled.

- `968.json` (Slice C): Bohr testnet contract address, deployment tx, create/pay txs,
  recipient balance deltas, chain ID, compiler settings, ABI reference, timestamps.
- `677.json` (Slice F): same shape for BOT Chain mainnet, only after security gates pass.

Never commit keys. Addresses here must match on-chain `eth_getCode` and verified source.
