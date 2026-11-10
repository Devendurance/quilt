# memory.md

- Remote https://github.com/Devendurance/quilt.git was empty at Slice A (ls-remote returned no refs).
- Slice B: QuiltSplits.sol + 24-test suite green; OZ 5.6.1, chai-matchers 2.1.2; tsconfig target ES2020.
- Chain facts verified: rpc.bohr.life = 968 (0x3c8), rpc.botchain.ai = 677 (0x2a5).
- Push to origin/main works (Slice A af5fdb0 pushed fine; old auth-blocker note was wrong).
- Conventions: fail closed on unset contract address; no NEXT_PUBLIC_ secrets; .fast-build/ not committed.
- Frontend deps installed as structure only in Slice A; no Quilt UI built yet.
