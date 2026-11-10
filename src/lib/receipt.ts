import { parseEventLogs, type Log } from "viem";
import { quiltAbi } from "./quilt-abi";

type Addr = `0x${string}`;
const eq = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/** Mirror of QuiltSplits._amounts: first N-1 shares floor, last gets the remainder. */
export function computeAmounts(amountWei: bigint, weightsBps: readonly number[]): bigint[] {
  const n = weightsBps.length;
  const out: bigint[] = [];
  let accounted = 0n;
  for (let i = 0; i < n - 1; i++) {
    const share = (amountWei * BigInt(weightsBps[i])) / 10_000n;
    out.push(share);
    accounted += share;
  }
  out.push(amountWei - accounted);
  return out;
}

export type PayCheck =
  | { ok: true; payouts: { recipient: Addr; amount: bigint }[] }
  | { ok: false; reason: string };

/**
 * Verify a pay() receipt. Only logs emitted by the canonical contract are
 * considered, so look-alike events from other contracts are ignored. The
 * payouts must match the stored recipients in order, the exact quote, and the
 * SplitPaid total. Anything else returns ok:false and must not be shown as paid.
 */
export function verifyPayReceipt(args: {
  logs: readonly Log[];
  contract: Addr;
  splitId: bigint;
  recipients: readonly Addr[];
  quote: readonly bigint[];
  amountWei: bigint;
}): PayCheck {
  const own = args.logs.filter((l) => eq(l.address, args.contract));
  const paid = parseEventLogs({ abi: quiltAbi, eventName: "RecipientPaid", logs: own as never }).filter((l) => l.args.splitId === args.splitId);
  const total = parseEventLogs({ abi: quiltAbi, eventName: "SplitPaid", logs: own as never }).filter((l) => l.args.splitId === args.splitId);
  if (total.length !== 1) return { ok: false, reason: "Receipt has no single SplitPaid event from the Quilt contract." };
  if (total[0].args.totalAmount !== args.amountWei) return { ok: false, reason: "Receipt total doesn't match the amount you sent." };
  if (paid.length !== args.recipients.length || args.quote.length !== args.recipients.length)
    return { ok: false, reason: "Receipt payout count doesn't match the split's recipients." };
  let sum = 0n;
  const payouts: { recipient: Addr; amount: bigint }[] = [];
  for (let i = 0; i < paid.length; i++) {
    const a = paid[i].args;
    if (!a.recipient || a.amount === undefined || !eq(a.recipient, args.recipients[i]))
      return { ok: false, reason: `Payout ${i + 1} went to an unexpected address.` };
    if (a.amount !== args.quote[i]) return { ok: false, reason: `Payout ${i + 1} doesn't match the contract's quote.` };
    sum += a.amount;
    payouts.push({ recipient: args.recipients[i], amount: a.amount });
  }
  if (sum !== args.amountWei) return { ok: false, reason: "Payouts don't add up to the amount sent." };
  return { ok: true, payouts };
}

/** Extract the new split id from a createSplit receipt, canonical contract only. */
export function splitIdFromCreateReceipt(logs: readonly Log[], contract: Addr, creator: Addr): bigint | null {
  const own = logs.filter((l) => eq(l.address, contract));
  const ev = parseEventLogs({ abi: quiltAbi, eventName: "SplitCreated", logs: own as never }).filter((l) => l.args.creator && eq(l.args.creator, creator));
  return ev.length === 1 && ev[0].args.splitId !== undefined ? ev[0].args.splitId : null;
}

/** True when stored split equals what the user submitted (order-sensitive). */
export function splitMatches(
  stored: { creator: string; recipients: readonly string[]; weightsBps: readonly number[] },
  submitted: { creator: string; recipients: readonly string[]; weightsBps: readonly number[] },
): boolean {
  return (
    eq(stored.creator, submitted.creator) &&
    stored.recipients.length === submitted.recipients.length &&
    stored.recipients.every((r, i) => eq(r, submitted.recipients[i])) &&
    stored.weightsBps.every((w, i) => Number(w) === submitted.weightsBps[i])
  );
}

/** Balance must cover the value plus the estimated fee. Unknown fee: only the value can be checked. */
export function balanceCheck(balance: bigint, value: bigint, fee: bigint | null): { ok: boolean; feeKnown: boolean; needed: bigint } {
  const needed = value + (fee ?? 0n);
  return { ok: balance >= needed, feeKnown: fee !== null, needed };
}
