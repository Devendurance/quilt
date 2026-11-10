import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import * as dotenv from "dotenv";

dotenv.config();

const deployerKey = process.env.DEPLOYER_PRIVATE_KEY;
const accounts = deployerKey ? [deployerKey] : [];

const config: HardhatUserConfig = {
  solidity: {
    // Pinned compiler for Slice B contract work. Slice B MUST use `pragma solidity 0.8.28;`.
    version: "0.8.28",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  paths: {
    sources: "./contracts/src",
    tests: "./contracts/test",
    cache: "./contracts/cache",
    artifacts: "./contracts/artifacts",
  },
  // Deploy scripts live in ./contracts/script; run with an explicit path,
  // e.g. npx hardhat run contracts/script/deploy.ts --network bohr
  networks: {
    hardhat: {},
    // Bohr testnet, chain 968. Faucet: https://faucet.botchain.ai
    bohr: {
      url: process.env.BOHR_RPC_URL ?? "https://rpc.bohr.life",
      chainId: 968,
      accounts,
    },
    // BOT Chain mainnet, chain 677. Slice F only, small-value smoke, funded deployer.
    botchain: {
      url: process.env.BOTCHAIN_RPC_URL ?? "https://rpc.botchain.ai",
      chainId: 677,
      accounts,
    },
  },
};

export default config;
