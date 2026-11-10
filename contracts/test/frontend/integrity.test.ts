import { expect } from "chai";
import { encodeAbiParameters, encodeEventTopics, type Log } from "viem";
import { quiltAbi } from "../../../src/lib/quilt-abi";
import { balanceCheck, computeAmounts, splitIdFromCreateReceipt, splitMatches, verifyPayReceipt } from "../../../src/lib/receipt";
import { resolveNetwork } from "../../../src/lib/network";

const CONTRACT = "0xdc7effbb316a9a194c2779d33d28d0fa3347fb7e" as const;
const EVIL = "0x00000000000000000000000000000000000bad01" as const;
const A = "0x374A94C75BD463635Cc6C96141B0EF31aCd02EF3" as const;
const B = "0xD691aE1F1700cec7DDcAcF0e5ECBf276D0ac0d03" as const;
const PAYER = "0x1111111111111111111111111111111111111111" as const;

const recipientPaid = (address: `0x${string}`, splitId: bigint, recipient: `0x${string}`, amount: bigint) =>
  ({ address, topics: encodeEventTopics({ abi: quiltAbi, eventName: "RecipientPaid", args: { splitId, recipient } }), data: encodeAbiParameters([{ type: "uint256" }], [amount]) }) as unknown as Log;
const splitPaid = (address: `0x${string}`, splitId: bigint, payer: `0x${string}`, total: bigint) =>
  ({ address, topics: encodeEventTopics({ abi: quiltAbi, eventName: "SplitPaid", args: { splitId, payer } }), data: encodeAbiParameters([{ type: "uint256" }], [total]) }) as unknown as Log;
const splitCreated = (address: `0x${string}`, splitId: bigint, creator: `0x${string}`) =>
  ({ address, topics: encodeEventTopics({ abi: quiltAbi, eventName: "SplitCreated", args: { splitId, creator } }), data: "0x" }) as unknown as Log;

const weights = [6000, 4000];
const amount = 1_000_000_000_000_000n;
const quote = computeAmounts(amount, weights);
const good = (addr: `0x${string}` = CONTRACT): Log[] => [
  splitPaid(addr, 2n, PAYER, amount),
  recipientPaid(addr, 2n, A, quote[0]),
  recipientPaid(addr, 2n, B, quote[1]),
];
const args = (logs: Log[]) => ({ logs, contract: CONTRACT, splitId: 2n, recipients: [A, B] as `0x${string}`[], quote, amountWei: amount });

describe("frontend integrity: receipts", () => {
  it("computeAmounts matches the proven Slice C payouts and sums exactly", () => {
    expect(quote).to.deep.equal([600000000000000n, 400000000000000n]);
    for (const v of [1_001n, 7n * 10n ** 18n + 3n, 99_999n]) {
      expect(computeAmounts(v, [3333, 3333, 3334]).reduce((a, b) => a + b, 0n)).to.equal(v);
    }
  });

  it("accepts a genuine receipt from the canonical contract", () => {
    const r = verifyPayReceipt(args(good()));
    expect(r.ok).to.equal(true);
  });

  it("ignores identical-looking events from another contract", () => {
    // Forged payouts from a different address must not count, even if they alone look valid.
    const r = verifyPayReceipt(args(good(EVIL)));
    expect(r.ok).to.equal(false);
  });

  it("ignores forged extra events and still validates the real ones", () => {
    const logs = [...good(), recipientPaid(EVIL, 2n, PAYER, 5n), splitPaid(EVIL, 2n, PAYER, 5n)];
    expect(verifyPayReceipt(args(logs)).ok).to.equal(true);
  });

  it("rejects wrong recipient, wrong order, wrong amount and wrong total", () => {
    expect(verifyPayReceipt(args([splitPaid(CONTRACT, 2n, PAYER, amount), recipientPaid(CONTRACT, 2n, PAYER, quote[0]), recipientPaid(CONTRACT, 2n, B, quote[1])])).ok).to.equal(false);
    expect(verifyPayReceipt(args([splitPaid(CONTRACT, 2n, PAYER, amount), recipientPaid(CONTRACT, 2n, B, quote[1]), recipientPaid(CONTRACT, 2n, A, quote[0])])).ok).to.equal(false);
    expect(verifyPayReceipt(args([splitPaid(CONTRACT, 2n, PAYER, amount), recipientPaid(CONTRACT, 2n, A, quote[0] + 1n), recipientPaid(CONTRACT, 2n, B, quote[1] - 1n)])).ok).to.equal(false);
    expect(verifyPayReceipt(args([splitPaid(CONTRACT, 2n, PAYER, amount + 1n), ...good().slice(1)])).ok).to.equal(false);
  });

  it("rejects events for a different split id and missing events", () => {
    expect(verifyPayReceipt(args([splitPaid(CONTRACT, 9n, PAYER, amount), recipientPaid(CONTRACT, 9n, A, quote[0]), recipientPaid(CONTRACT, 9n, B, quote[1])])).ok).to.equal(false);
    expect(verifyPayReceipt(args([])).ok).to.equal(false);
  });

  it("create receipt: only canonical contract and matching creator yield an id", () => {
    expect(splitIdFromCreateReceipt([splitCreated(CONTRACT, 3n, A)], CONTRACT, A)).to.equal(3n);
    expect(splitIdFromCreateReceipt([splitCreated(EVIL, 3n, A)], CONTRACT, A)).to.equal(null);
    expect(splitIdFromCreateReceipt([splitCreated(CONTRACT, 3n, B)], CONTRACT, A)).to.equal(null);
    expect(splitIdFromCreateReceipt([splitCreated(EVIL, 99n, A), splitCreated(CONTRACT, 3n, A)], CONTRACT, A)).to.equal(3n);
  });

  it("splitMatches is order and case sensitive on content, not on hex case", () => {
    const s = { creator: A, recipients: [A, B], weightsBps: [6000, 4000] };
    expect(splitMatches(s, { creator: A.toLowerCase(), recipients: [A.toLowerCase(), B], weightsBps: [6000, 4000] })).to.equal(true);
    expect(splitMatches(s, { creator: A, recipients: [B, A], weightsBps: [6000, 4000] })).to.equal(false);
    expect(splitMatches(s, { creator: A, recipients: [A, B], weightsBps: [5000, 5000] })).to.equal(false);
  });
});

describe("frontend integrity: balance", () => {
  it("requires value plus fee when the fee is known", () => {
    expect(balanceCheck(100n, 100n, 1n).ok).to.equal(false);
    expect(balanceCheck(101n, 100n, 1n).ok).to.equal(true);
  });
  it("reports an unknown fee honestly and checks only the value", () => {
    const r = balanceCheck(100n, 100n, null);
    expect(r.feeKnown).to.equal(false);
    expect(r.ok).to.equal(true);
    expect(balanceCheck(99n, 100n, null).ok).to.equal(false);
  });
});

describe("frontend integrity: network config", () => {
  const A968 = "0xdc7effbb316a9a194c2779d33d28d0fa3347fb7e";
  const A677 = "0x2222222222222222222222222222222222222222";

  it("defaults to Bohr testnet with tBOT and writes enabled", () => {
    const n = resolveNetwork({ addr968: A968 });
    expect(n.chain.id).to.equal(968);
    expect(n.chain.currency).to.equal("tBOT");
    expect(n.writesEnabled).to.equal(true);
  });
  it("never falls back from 677 to the 968 address", () => {
    const n = resolveNetwork({ network: "677", addr968: A968 });
    expect(n.address).to.equal(null);
    expect(n.writesEnabled).to.equal(false);
  });
  it("mainnet uses BOT and keeps writes off unless explicitly enabled", () => {
    const off = resolveNetwork({ network: "677", addr677: A677 });
    expect(off.chain.id).to.equal(677);
    expect(off.chain.currency).to.equal("BOT");
    expect(off.chain.explorerUrl).to.equal("https://scan.botchain.ai");
    expect(off.address).to.equal(A677);
    expect(off.writesEnabled).to.equal(false);
    expect(resolveNetwork({ network: "677", addr677: A677, mainnetWrites: "yes" }).writesEnabled).to.equal(false);
    expect(resolveNetwork({ network: "677", addr677: A677, mainnetWrites: "true" }).writesEnabled).to.equal(true);
  });
  it("unknown network and malformed address fail closed", () => {
    expect(resolveNetwork({ network: "1", addr968: A968 }).writesEnabled).to.equal(false);
    expect(resolveNetwork({ addr968: "0x123" }).address).to.equal(null);
  });
});
