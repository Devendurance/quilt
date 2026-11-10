import { BOHR_TESTNET } from "./chains";
import { getQuiltContractAddress } from "./quilt-addresses";

export const CHAIN_ID = BOHR_TESTNET.id;

// Next inlines NEXT_PUBLIC_ vars only for literal access, so read it here.
const raw = process.env.NEXT_PUBLIC_QUILT_CONTRACT_ADDRESS_968;
export const QUILT_ADDRESS = /^0x[0-9a-fA-F]{40}$/.test(raw ?? "")
  ? (raw as `0x${string}`)
  : getQuiltContractAddress(CHAIN_ID);

export type SplitView = {
  creator: `0x${string}`;
  recipients: readonly `0x${string}`[];
  weightsBps: readonly number[];
  totalPaid: bigint;
  paymentCount: bigint;
};

export const shortAddr = (a: string) => `${a.slice(0, 6)}...${a.slice(-4)}`;
export const bpsToPercent = (bps: number) => (bps / 100).toFixed(2).replace(/\.?0+$/, "");

export function formatBot(wei: bigint, maxDecimals = 6): string {
  const base = 10n ** 18n;
  const whole = wei / base;
  let frac = (wei % base).toString().padStart(18, "0").slice(0, maxDecimals).replace(/0+$/, "");
  if (wei > 0n && whole === 0n && frac === "") frac = "0".padEnd(maxDecimals, "0") + "+";
  return frac ? `${whole}.${frac}` : whole.toString();
}

/** Human-readable reason from a viem error, decoded revert name when present. */
export function describeError(err: unknown): { kind: "rejected" | "revert" | "other"; message: string } {
  const e = err as { name?: string; shortMessage?: string; message?: string; cause?: unknown; code?: number };
  const text = `${e?.name ?? ""} ${e?.shortMessage ?? ""} ${e?.message ?? ""}`;
  if (/UserRejected|User rejected|denied transaction|code.?4001/i.test(text) || e?.code === 4001) {
    return { kind: "rejected", message: "You rejected the request in your wallet. Nothing was sent." };
  }
  const known: Array<[RegExp, string]> = [
    [/ZeroShare/, "That amount is too small. At least one recipient's share would round to zero."],
    [/ZeroPayment/, "Enter an amount above zero."],
    [/SplitNotFound/, "This split doesn't exist on this contract."],
    [/TransferFailed/, "A recipient rejected the transfer, so the whole payment reverts."],
    [/DuplicateRecipient/, "Each recipient address must be unique."],
    [/BadTotalWeight/, "Shares must total exactly 100%."],
    [/InvalidRecipientCount/, "A split needs 2 to 5 recipients."],
    [/ZeroRecipientAddress/, "A recipient address is the zero address."],
    [/InvalidWeight/, "Every recipient needs a share above zero."],
    [/insufficient funds/i, "Not enough tBOT to cover the amount plus gas."],
  ];
  for (const [re, msg] of known) if (re.test(text)) return { kind: "revert", message: msg };
  return { kind: "other", message: e?.shortMessage ?? e?.message ?? "Something went wrong." };
}
