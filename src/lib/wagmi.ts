import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { defineChain } from "viem";
import { BOHR_TESTNET } from "./chains";

export const bohr = defineChain({
  id: BOHR_TESTNET.id,
  name: BOHR_TESTNET.name,
  nativeCurrency: { name: "Bohr test BOT", symbol: BOHR_TESTNET.currency, decimals: 18 },
  rpcUrls: { default: { http: [BOHR_TESTNET.rpcUrl] } },
  blockExplorers: { default: { name: "BOT Scan", url: BOHR_TESTNET.explorerUrl } },
  testnet: true,
});

export const wagmiConfig = createConfig({
  chains: [bohr],
  connectors: [injected()],
  transports: { [bohr.id]: http(BOHR_TESTNET.rpcUrl) },
  ssr: true,
});
