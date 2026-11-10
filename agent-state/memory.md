# memory.md

- Remote https://github.com/Devendurance/quilt.git was empty at Slice A (ls-remote returned no refs).
- Slice C: LIVE PROOF PASS on Bohr 968. Contract 0xdc7effbb316a9a194c2779d33d28d0fa3347fb7e;
  split 2 created+paid (0.001 tBOT, exact 600000000000000/400000000000000 deltas,
  totalPaid=1e15, paymentCount=1). Split 1 also exists on-chain from the run that
  exposed the snapshot bug. Evidence in deployments/968.json + ABI.
- Chain facts verified: rpc.bohr.life = 968 (0x3c8), rpc.botchain.ai = 677 (0x2a5).
- Push to origin/main works (Slice A af5fdb0 pushed fine; old auth-blocker note was wrong).
- Conventions: fail closed on unset contract address; no NEXT_PUBLIC_ secrets; .fast-build/ not committed.
- Frontend deps installed as structure only in Slice A; no Quilt UI built yet.
- Slice D browser proof (Bohr 968): split 3 created tx 0xdd14b5d0e44c56a6a26a88406c974135b48fc67c02835800fa7b1ef280ab9094,
  paid 0.001 tBOT tx 0x565c8d7fd56d654ab9980abeb2772b2853683ff87a65cdd75b3c1546eb51f18f (50/30/20, receipt status 1).
- Bohr has no multicall3 (eth_getCode empty). Dashboard does one read per split.
- Satoshi has no 600 weight: never use font-semibold. `next dev` rewrites AGENTS.md, so agentRules:false is set in next.config.ts.
- Heredocs with apostrophes in JSX can break the bash tool. Use the Write tool for TSX files.
