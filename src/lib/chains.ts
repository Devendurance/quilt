export type QuiltChainConfig = {
  id: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  currency: string;
  testnet: boolean;
};

export const BOHR_TESTNET: QuiltChainConfig = {
  id: 968,
  name: "Bohr Testnet",
  rpcUrl: "https://rpc.bohr.life",
  explorerUrl: "https://scan.bohr.life",
  currency: "tBOT",
  testnet: true,
};

export const BOTCHAIN_MAINNET: QuiltChainConfig = {
  id: 677,
  name: "BOT Chain",
  rpcUrl: "https://rpc.botchain.ai",
  explorerUrl: "https://scan.botchain.ai",
  currency: "BOT",
  testnet: false,
};

export const QUILT_CHAINS: QuiltChainConfig[] = [BOHR_TESTNET, BOTCHAIN_MAINNET];

export function getChainConfig(chainId: number): QuiltChainConfig | null {
  return QUILT_CHAINS.find((c) => c.id === chainId) ?? null;
}

export function txUrl(chainId: number, hash: string): string | null {
  const chain = getChainConfig(chainId);
  return chain ? `${chain.explorerUrl}/tx/${hash}` : null;
}
