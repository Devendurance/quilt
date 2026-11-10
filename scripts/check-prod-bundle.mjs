// Fails if a production build output can load the dev signer or exposes secrets.
// Run after `next build` (ideally with NEXT_PUBLIC_DEV_WALLET_URL set, to prove the guard).
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import "dotenv/config";

const bad = [/provider\.js/, /dev-wallet/, /127\.0\.0\.1:8545/, /quilt-dev-role/, /NEXT_PUBLIC_DEV_WALLET_URL/];
const secrets = [process.env.DEPLOYER_PRIVATE_KEY, process.env.PAYER_PRIVATE_KEY].filter(Boolean).map((k) => k.replace(/^0x/, "").toLowerCase());
const hits = [];
function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    const st = statSync(p);
    if (st.isDirectory()) { if (f !== "cache" && f !== "dev") walk(p); continue; }
    // Source maps and file-trace manifests only list source text and package files, they cannot load code.
    if (/\.map$|\.nft\.json$/.test(f)) continue;
    if (!/\.(js|html|rsc|json|txt|css)$/.test(f) && !p.includes("server")) continue;
    if (st.size > 20_000_000) continue;
    const t = readFileSync(p, "utf8");
    for (const re of bad) if (re.test(t)) hits.push(`${p}: ${re}`);
    const low = t.toLowerCase();
    for (const k of secrets) if (k.length >= 32 && low.includes(k)) hits.push(`${p}: PRIVATE KEY MATERIAL`);
  }
}
walk(".next");
if (hits.length) { console.error("FAIL\n" + hits.slice(0, 20).join("\n")); process.exit(1); }
console.log("OK: no dev signer reference or key material in .next output");
