import type { NextConfig } from "next";
import path from "node:path";
import { readFileSync } from "node:fs";

// The Bohr testnet contract address is public. Default it from the committed
// deployment record so a deploy without env vars still works. Mainnet (677) has
// no default on purpose and never falls back to this value.
function deployedAddress(chainId: number): string | undefined {
  try {
    const d = JSON.parse(readFileSync(path.join(__dirname, "deployments", `${chainId}.json`), "utf8"));
    return typeof d.contract === "string" ? d.contract : undefined;
  } catch {
    return undefined;
  }
}

const nextConfig: NextConfig = {
  /* config options here */
  agentRules: false,
  env: {
    NEXT_PUBLIC_QUILT_CONTRACT_ADDRESS_968: process.env.NEXT_PUBLIC_QUILT_CONTRACT_ADDRESS_968 || deployedAddress(968) || "",
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    root: path.resolve(__dirname),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
