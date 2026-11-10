import {
  createPublicClient,
  createWalletClient,
  decodeEventLog,
  defineChain,
  http,
  type Abi,
  type Address,
  type TransactionReceipt,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import hre from "hardhat";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import type { PublicClient } from "viem";

const BOHR_CHAIN_ID = 968;
const BOHR_RPC_URL = process.env.BOHR_RPC_URL ?? "https://rpc.bohr.life";

function requireKey(name: "DEPLOYER_PRIVATE_KEY" | "PAYER_PRIVATE_KEY"): `0x${string}` {
  const v = (process.env[name] ?? "").trim();
  if (!/^0x[0-9a-fA-F]{64}$/.test(v)) {
    throw new Error(`${name} is missing or malformed. Set it in a local .env file (never commit it).`);
  }
  return v as `0x${string}`;
}

function readAddressEnv(name: "QUILT_CONTRACT_968"): Address | null {
  const v = (process.env[name] ?? "").trim();
  return /^0x[0-9a-fA-F]{40}$/.test(v) ? (v as Address) : null;
}

async function readQuiltArtifact() {
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
 * Slice C backend proof on Bohr testnet 968. No frontend involved.
 * - Fails closed unless connected chain is 968.
 * - Loads the contract from QUILT_CONTRACT_968 or deployments/968.json
 *   (verified bytecode), or deploys fresh when neither exists.
 * - Creator wallet creates a real 60/40 split; a DIFFERENT payer wallet pays
 *   a small positive tBOT amount; exact wei deltas are asserted on-chain.
 * - One revert path runs through call simulation (no gas spent on failure).
 * - Receipt logs are decoded directly; no eth_getLogs history queries.
 * - Writes the full evidence record to deployments/968.json.
 * Run: npx hardhat run scripts/smoke-create-pay.ts --network bohr
 */

type Receipt = TransactionReceipt;

async function makeClients() {
  const bohr = defineChain({
    id: 968,
    name: "Bohr Testnet",
    nativeCurrency: { name: "Test BOT", symbol: "tBOT", decimals: 18 },
    rpcUrls: { default: { http: [BOHR_RPC_URL] } },
    testnet: true,
  });
  const publicClient = createPublicClient({ chain: bohr, transport: http() });
  return { bohr, publicClient };
}

function decodedQuiltLogs(receipt: Receipt, contract: Address, abi: Abi) {
  return receipt.logs
    .filter((l) => l.address.toLowerCase() === contract.toLowerCase())
    .map((l) => decodeEventLog({ abi, data: l.data, topics: l.topics }));
}

async function main() {
  const creatorKey = requireKey("DEPLOYER_PRIVATE_KEY");
  const payerKey = requireKey("PAYER_PRIVATE_KEY");
  if (creatorKey === payerKey) {
    throw new Error("PAYER_PRIVATE_KEY must differ from DEPLOYER_PRIVATE_KEY.");
  }
  const { bohr, publicClient } = await makeClients();
  await assertBohr(publicClient);

  const creator = privateKeyToAccount(creatorKey);
  const payer = privateKeyToAccount(payerKey);
  const creatorClient = createWalletClient({ account: creator, chain: bohr, transport: http() });
  const payerClient = createWalletClient({ account: payer, chain: bohr, transport: http() });

  const artifact = await readQuiltArtifact();
  const abi = artifact.abi as Abi;

  let contract = readAddressEnv("QUILT_CONTRACT_968");
  let deployInfo: Record<string, unknown> = {};
  if (contract) {
    await assertBytecode(publicClient, contract);
  } else if (existsSync("deployments/968.json")) {
    const prior = JSON.parse(readFileSync("deployments/968.json", "utf8")) as {
      contract?: string;
    };
    if (prior.contract && /^0x[0-9a-fA-F]{40}$/.test(prior.contract)) {
      contract = prior.contract as Address;
      await assertBytecode(publicClient, contract);
      deployInfo = prior;
    }
  }
  if (!contract) {
    const hash = await creatorClient.deployContract({
      abi,
      bytecode: artifact.bytecode as `0x${string}`,
      account: creator,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    if (receipt.status !== "success" || !receipt.contractAddress) {
      throw new Error(`Inline deployment reverted: ${hash}`);
    }
    contract = receipt.contractAddress;
    await assertBytecode(publicClient, contract);
    deployInfo = {
      deployTx: hash,
      deployBlock: Number(receipt.blockNumber),
      deployer: creator.address,
    };
  }

  // Recipients are the two real key wallets: distinct, key-controlled, measurable.
  const recipients = [creator.address, payer.address] as const;
  const bps = [6000, 4000] as const;
  const amount = 1_000_000_000_000_000n; // 0.001 tBOT
  const expected = [(amount * 6000n) / 10000n, (amount * 4000n) / 10000n];

  const createHash = await creatorClient.writeContract({
    address: contract,
    abi,
    functionName: "createSplit",
    args: [[...recipients], [...bps]],
    account: creator,
  });
  const createReceipt = await publicClient.waitForTransactionReceipt({ hash: createHash });
  if (createReceipt.status !== "success") {
    throw new Error(`createSplit reverted: ${createHash}`);
  }
  const created = decodedQuiltLogs(createReceipt, contract, abi).filter(
    (e) => e.eventName === "SplitCreated"
  );
  if (created.length !== 1) throw new Error("SplitCreated missing from create receipt.");
  const splitId = (created[0].args as unknown as { splitId: bigint }).splitId;

  const stored = (await publicClient.readContract({
    address: contract,
    abi,
    functionName: "getSplit",
    args: [splitId],
  })) as unknown as {
    creator: Address;
    recipients: Address[];
    weightsBps: number[];
  };
  if (
    stored.creator.toLowerCase() !== creator.address.toLowerCase() ||
    stored.recipients.length !== 2 ||
    stored.weightsBps.join(",") !== "6000,4000"
  ) {
    throw new Error("getSplit does not match the created allocation.");
  }

  const quote = (await publicClient.readContract({
    address: contract,
    abi,
    functionName: "quoteSplit",
    args: [splitId, amount],
  })) as unknown as bigint[];
  if (quote.length !== 2 || quote[0] !== expected[0] || quote[1] !== expected[1]) {
    throw new Error(`quoteSplit mismatch: ${quote} vs expected ${expected}.`);
  }

  // Snapshot AFTER createSplit: the creator is also recipient[0] and paid gas
  // for creation, so pre-create balances would corrupt its payout delta.
  const before = [
    await publicClient.getBalance({ address: recipients[0] }),
    await publicClient.getBalance({ address: recipients[1] }),
  ];

  const payHash = await payerClient.writeContract({
    address: contract,
    abi,
    functionName: "pay",
    args: [splitId],
    value: amount,
    account: payer,
  });
  const payReceipt = await publicClient.waitForTransactionReceipt({ hash: payHash });
  if (payReceipt.status !== "success") {
    throw new Error(`pay reverted after submission: ${payHash}. Never treat submission as proof.`);
  }
  const gasCost =
    payReceipt.gasUsed * (payReceipt.effectiveGasPrice ?? 0n);
  const payEvents = decodedQuiltLogs(payReceipt, contract, abi);
  const paid = payEvents.filter((e) => e.eventName === "SplitPaid");
  const legs = payEvents.filter((e) => e.eventName === "RecipientPaid");
  if (paid.length !== 1 || legs.length !== 2) {
    throw new Error("SplitPaid/RecipientPaid events missing from pay receipt.");
  }
  const legAmounts = legs.map(
    (e) => (e.args as unknown as { amount: bigint }).amount
  );
  if (legAmounts[0] !== expected[0] || legAmounts[1] !== expected[1]) {
    throw new Error(`RecipientPaid amounts mismatch: ${legAmounts} vs ${expected}.`);
  }

  const after = [
    await publicClient.getBalance({ address: recipients[0] }),
    await publicClient.getBalance({ address: recipients[1] }),
  ];
  const delta0 = after[0] - before[0];
  const delta1 = after[1] - before[1];
  if (delta0 !== expected[0]) {
    throw new Error(`Creator delta ${delta0} != expected ${expected[0]}.`);
  }
  // The payer also funds the payment value, so its net delta is share - amount - gas.
  if (delta1 + gasCost + amount !== expected[1]) {
    throw new Error(`Payer delta+gas+amount ${delta1 + gasCost + amount} != expected ${expected[1]}.`);
  }
  if ((await publicClient.getBalance({ address: contract })) !== 0n) {
    throw new Error("Residual balance left in contract after pay.");
  }

  const counters = (await publicClient.readContract({
    address: contract,
    abi,
    functionName: "getSplit",
    args: [splitId],
  })) as unknown as { totalPaid: bigint; paymentCount: bigint };
  if (counters.totalPaid !== amount || counters.paymentCount !== 1n) {
    throw new Error("totalPaid/paymentCount mismatch after pay.");
  }
  const history = (await publicClient.readContract({
    address: contract,
    abi,
    functionName: "getCreatorSplitIds",
    args: [creator.address],
  })) as unknown as bigint[];
  if (!history.includes(splitId)) {
    throw new Error("Creator history missing the new split.");
  }

  // Expected-revert path via simulation: zero-value pay must revert, spending no gas.
  let reverted = false;
  try {
    await publicClient.simulateContract({
      address: contract,
      abi,
      functionName: "pay",
      args: [splitId],
      account: payer.address,
      value: 0n,
    });
  } catch {
    reverted = true;
  }
  if (!reverted) throw new Error("Zero-value pay simulation did not revert.");
  const afterRevert = (await publicClient.readContract({
    address: contract,
    abi,
    functionName: "getSplit",
    args: [splitId],
  })) as unknown as { totalPaid: bigint; paymentCount: bigint };
  if (afterRevert.totalPaid !== amount || afterRevert.paymentCount !== 1n) {
    throw new Error("State changed after the reverted simulation.");
  }

  mkdirSync("deployments", { recursive: true });
  writeFileSync(
    "deployments/QuiltSplits.abi.json",
    JSON.stringify(artifact.abi, null, 2) + "\n"
  );
  const record = {
    ...(existsSync("deployments/968.json")
      ? (JSON.parse(readFileSync("deployments/968.json", "utf8")) as Record<string, unknown>)
      : {}),
    ...deployInfo,
    chainId: 968,
    contract,
    compiler: { version: "0.8.28", optimizer: { enabled: true, runs: 200 } },
    abiRef: "deployments/QuiltSplits.abi.json",
    splitId: splitId.toString(),
    creator: creator.address,
    payer: payer.address,
    recipients: [
      { address: recipients[0], bps: 6000, expectedWei: expected[0].toString(), actualWei: delta0.toString() },
      { address: recipients[1], bps: 4000, expectedWei: expected[1].toString(), actualWei: (delta1 + gasCost + amount).toString() },
    ],
    createTx: createHash,
    createBlock: Number(createReceipt.blockNumber),
    payTx: payHash,
    payBlock: Number(payReceipt.blockNumber),
    payAmountWei: amount.toString(),
    payGasWei: gasCost.toString(),
    txStatus: "success",
    totalPaidWei: counters.totalPaid.toString(),
    paymentCount: counters.paymentCount.toString(),
    revertCheck: "zero-value pay simulation reverted; counters unchanged",
    provenAt: new Date().toISOString(),
  };
  writeFileSync("deployments/968.json", JSON.stringify(record, null, 2) + "\n");

  console.log(
    JSON.stringify(
      {
        chainId: 968,
        contract,
        splitId: splitId.toString(),
        createTx: createHash,
        payTx: payHash,
        expectedWei: expected.map(String),
        actualWei: [delta0.toString(), (delta1 + gasCost + amount).toString()],
        totalPaidWei: counters.totalPaid.toString(),
        paymentCount: counters.paymentCount.toString(),
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
