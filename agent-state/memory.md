# memory.md

- Remote https://github.com/Devendurance/quilt.git was empty at Slice A (ls-remote returned no refs).
- Slice C: deploy + proof scripts written, typecheck/lint/tests/build green, dry-runs fail
  closed without keys. Live run BLOCKED on funding: no DEPLOYER/PAYER key in env,
  no .env file, faucet.botchain.ai is interactive-only (HTTP 200 Next.js page).
- Chain facts verified: rpc.bohr.life = 968 (0x3c8), rpc.botchain.ai = 677 (0x2a5).
- Push to origin/main works (Slice A af5fdb0 pushed fine; old auth-blocker note was wrong).
- Conventions: fail closed on unset contract address; no NEXT_PUBLIC_ secrets; .fast-build/ not committed.
- Frontend deps installed as structure only in Slice A; no Quilt UI built yet.
