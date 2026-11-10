import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { defineChain } from "viem";
import { CHAIN } from "./contract";

export const activeChain = defineChain({
  id: CHAIN.id,
  name: CHAIN.name,
  nativeCurrency: { name: CHAIN.testnet ? "Bohr test BOT" : "BOT", symbol: CHAIN.currency, decimals: 18 },
  rpcUrls: { default: { http: [CHAIN.rpcUrl] } },
  blockExplorers: { default: { name: "BOT Scan", url: CHAIN.explorerUrl } },
  testnet: CHAIN.testnet,
});

export const wagmiConfig = createConfig({
  chains: [activeChain],
  connectors: [injected()],
  transports: { [activeChain.id]: http(CHAIN.rpcUrl) },
  ssr: true,
});
