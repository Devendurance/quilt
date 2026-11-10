# contracts/

Solidity backend for Quilt. Owned by Slice B (not yet implemented).

- Implementation: `src/QuiltSplits.sol` (Slice B writes this; Slice A intentionally adds no contract code).
- Tests: `test/` (unit + fuzz + reentrancy, Slice B).
- Deploy scripts: `script/` (Slice C/F).
- Compiler: Solidity **0.8.28**, optimizer enabled (runs 200). Pinned in `hardhat.config.ts`.
- Required interface (from `Quilt_5_Hour_Backend_First_Execution_Plan.md`):
  `createSplit(recipients, weightsBps)`, `pay(splitId)` payable nonReentrant,
  `getSplit(id)`, `getCreatorSplitIds(creator)`, `quoteSplit(id, amount)`,
  counters `totalPaid` / `paymentCount`, events `SplitCreated`, `RecipientPaid`, `SplitPaid`.
- Invariants: 2-5 unique nonzero recipients, positive bps summing to exactly 10000,
  last-recipient wei remainder, reject zero-share dust payments, atomic revert on
  recipient failure, no fees, no admin drain, no upgradeability.
