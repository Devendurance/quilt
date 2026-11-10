import { BOHR_TESTNET, BOTCHAIN_MAINNET, type QuiltChainConfig } from "./chains";

export type NetworkEnv = {
  /** NEXT_PUBLIC_QUILT_NETWORK: "968" (default) or "677". */
  network?: string;
  addr968?: string;
  addr677?: string;
  /** NEXT_PUBLIC_QUILT_MAINNET_WRITES must be exactly "true" to enable mainnet writes. */
  mainnetWrites?: string;
};

export type ResolvedNetwork = {
  chain: QuiltChainConfig;
  address: `0x${string}` | null;
  writesEnabled: boolean;
  writesDisabledReason: string | null;
};

const isAddr = (v: string | undefined): v is `0x${string}` => !!v && /^0x[0-9a-fA-F]{40}$/.test(v);

/**
 * Pure and side-effect free so it can be tested. Each chain reads ONLY its own
 * address variable. There is never a fallback between 677 and 968.
 */
export function resolveNetwork(env: NetworkEnv): ResolvedNetwork {
  const sel = (env.network ?? "").trim();
  if (sel !== "" && sel !== "968" && sel !== "677") {
    return { chain: BOHR_TESTNET, address: null, writesEnabled: false, writesDisabledReason: `Unknown network "${sel}". Set NEXT_PUBLIC_QUILT_NETWORK to 968 or 677.` };
  }
  const chain = sel === "677" ? BOTCHAIN_MAINNET : BOHR_TESTNET;
  const address = isAddr(sel === "677" ? env.addr677 : env.addr968) ? ((sel === "677" ? env.addr677 : env.addr968) as `0x${string}`) : null;
  if (!address) {
    return { chain, address: null, writesEnabled: false, writesDisabledReason: `No QuiltSplits contract is configured for ${chain.name}.` };
  }
  if (!chain.testnet && env.mainnetWrites !== "true") {
    return { chain, address, writesEnabled: false, writesDisabledReason: "Payments on BOT Chain mainnet aren't open yet. Reading is enabled, writing is off." };
  }
  return { chain, address, writesEnabled: true, writesDisabledReason: null };
}
