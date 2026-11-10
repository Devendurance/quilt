import {
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import type { Address, PublicClient } from "viem";

const BOHR_CHAIN_ID = 968;
const BOHR_RPC_URL = process.env.BOHR_RPC_URL ?? "https://rpc.bohr.life";

function requireKey(name: "DEPLOYER_PRIVATE_KEY"): `0x${string}` {
  const v = (process.env[name] ?? "").trim();
  if (!/^0x[0-9a-fA-F]{64}$/.test(v)) {
    throw new Error(`${name} is missing or malformed. Set it in a local .env file (never commit it).`);
  }
  return v as `0x${string}`;
}

async function readQuiltArtifact() {
  const hre = await import("hardhat");
  return hre.artifacts.readArtifact("QuiltSplits");
}

async function assertBohr(publicClient: PublicClient): Promise<number> {
  const chainId = await publicClient.getChainId();
  if (chainId !== BOHR_CHAIN_ID) {
    throw new Error(`Refusing: connected chainId=${chainId}, need ${BOHR_CHAIN_ID}.`);
  }
  return chainId;
}

async function assertBytecode(publicClient: PublicClient, address: Address) {
  const code = await publicClient.getBytecode({ address });
  if (!code || code === "0x") {
    throw new Error(`No bytecode at ${address} on Bohr 968.`);
  }
}

/**
 * Deploy QuiltSplits to Bohr testnet 968. Repeatable: every run deploys a
 * fresh contract and records it; the proof script reuses it from here.
 * Run: npx hardhat run contracts/script/deploy.ts --network bohr
 */
async function main() {
  const deployerKey = requireKey("DEPLOYER_PRIVATE_KEY");
  const bohr = defineChain({
    id: 968,
    name: "Bohr Testnet",
    nativeCurrency: { name: "Test BOT", symbol: "tBOT", decimals: 18 },
    rpcUrls: { default: { http: [BOHR_RPC_URL] } },
    testnet: true,
  });
  const publicClient = createPublicClient({ chain: bohr, transport: http() });
  await assertBohr(publicClient);

  const deployer = privateKeyToAccount(deployerKey);
  const balance = await publicClient.getBalance({ address: deployer.address });
  if (balance === 0n) {
    throw new Error(
      `Deployer ${deployer.address} holds 0 tBOT. Fund it via https://faucet.botchain.ai first.`
    );
  }
  const wallet = createWalletClient({
    account: deployer,
    chain: bohr,
    transport: http(),
  });

  const artifact = await readQuiltArtifact();
  const hash = await wallet.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode as `0x${string}`,
    account: deployer,
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success" || !receipt.contractAddress) {
    throw new Error(`Deployment reverted or missing address: ${hash}`);
  }
  await assertBytecode(publicClient, receipt.contractAddress);

  mkdirSync("deployments", { recursive: true });
  writeFileSync(
    "deployments/QuiltSplits.abi.json",
    JSON.stringify(artifact.abi, null, 2) + "\n"
  );

  const prior = existsSync("deployments/968.json")
    ? JSON.parse(readFileSync("deployments/968.json", "utf8"))
    : {};
  const record = {
    ...prior,
    chainId: 968,
    contract: receipt.contractAddress,
    deployer: deployer.address,
    deployTx: hash,
    deployBlock: Number(receipt.blockNumber),
    compiler: { version: "0.8.28", optimizer: { enabled: true, runs: 200 } },
    abiRef: "deployments/QuiltSplits.abi.json",
    deployedAt: new Date().toISOString(),
  };
  writeFileSync("deployments/968.json", JSON.stringify(record, null, 2) + "\n");

  console.log(
    JSON.stringify(
      {
        chainId: 968,
        contract: receipt.contractAddress,
        deployer: deployer.address,
        deployTx: hash,
        deployBlock: Number(receipt.blockNumber),
      },
      null,
      2
    )
  );
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
