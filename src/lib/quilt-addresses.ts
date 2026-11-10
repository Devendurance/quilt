import { BOHR_TESTNET, BOTCHAIN_MAINNET } from "./chains";

type Address = `0x${string}`;

function isAddress(value: string | undefined): value is Address {
  return !!value && /^0x[0-9a-fA-F]{40}$/.test(value);
}

/**
 * Environment-scoped QuiltSplits contract address.
 * Returns null when unset or malformed. Callers MUST fail closed:
 * never fall back from mainnet (677) to testnet (968).
 */
export function getQuiltContractAddress(chainId: number): Address | null {
  if (chainId === BOHR_TESTNET.id) {
    return isAddress(process.env.NEXT_PUBLIC_QUILT_CONTRACT_ADDRESS_968)
      ? process.env.NEXT_PUBLIC_QUILT_CONTRACT_ADDRESS_968
      : null;
  }
  if (chainId === BOTCHAIN_MAINNET.id) {
    return isAddress(process.env.NEXT_PUBLIC_QUILT_CONTRACT_ADDRESS_677)
      ? process.env.NEXT_PUBLIC_QUILT_CONTRACT_ADDRESS_677
      : null;
  }
  return null;
}
