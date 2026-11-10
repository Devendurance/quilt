"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useBalance, usePublicClient, useReadContract } from "wagmi";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatEther, parseEther, parseEventLogs } from "viem";
import { quiltAbi } from "@/lib/quilt-abi";
import { CHAIN_ID, QUILT_ADDRESS, bpsToPercent, describeError, formatBot, shortAddr, type SplitView } from "@/lib/contract";
import { BOHR_TESTNET } from "@/lib/chains";
import { useQuiltTx, useQuiltWallet } from "@/lib/hooks";
import { RecipientList } from "@/components/RecipientList";
import { CopyButton } from "@/components/CopyButton";
import { TxPanel } from "@/components/TxPanel";

function Notice({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="glass mx-auto my-8 max-w-[760px] p-10 text-center" role="alert">
      <h1 className="h3">{title}</h1>
      <p className="mt-3 text-slate">{body}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function SplitClient() {
  const params = useParams<{ splitId: string }>();
  const raw = params.splitId ?? "";
  const valid = /^[1-9]\d{0,17}$/.test(raw);
  const splitId = valid ? BigInt(raw) : 0n;
  const qc = useQueryClient();

  const wallet = useQuiltWallet();
  const publicClient = usePublicClient({ chainId: CHAIN_ID });
  const { state, run, reset } = useQuiltTx();
  const [amount, setAmount] = useState("");

  const splitQ = useReadContract({
    address: QUILT_ADDRESS ?? undefined,
    abi: quiltAbi,
    functionName: "getSplit",
    args: [splitId],
    chainId: CHAIN_ID,
    query: { enabled: valid && !!QUILT_ADDRESS, retry: false },
  });

  const parsed = useMemo(() => {
    if (amount.trim() === "") return { wei: 0n, error: null as string | null };
    if (!/^\d*\.?\d{0,18}$/.test(amount.trim())) return { wei: 0n, error: "Enter a number with up to 18 decimals." };
    try {
      return { wei: parseEther(amount.trim()), error: null };
    } catch {
      return { wei: 0n, error: "Enter a valid amount." };
    }
  }, [amount]);

  const quoteQ = useReadContract({
    address: QUILT_ADDRESS ?? undefined,
    abi: quiltAbi,
    functionName: "quoteSplit",
    args: [splitId, parsed.wei],
    chainId: CHAIN_ID,
    query: { enabled: valid && !!QUILT_ADDRESS && splitQ.isSuccess && parsed.wei > 0n, retry: false },
  });

  const { data: balance } = useBalance({ address: wallet.address, chainId: CHAIN_ID, query: { enabled: !!wallet.address } });

  const ready = wallet.isConnected && !wallet.wrongNetwork && quoteQ.isSuccess && parsed.wei > 0n;
  const feeQ = useQuery({
    queryKey: ["fee", splitId.toString(), parsed.wei.toString(), wallet.address],
    enabled: ready && !!publicClient && !!QUILT_ADDRESS,
    retry: false,
    queryFn: async () => {
      const [gas, price] = await Promise.all([
        publicClient!.estimateContractGas({
          address: QUILT_ADDRESS!,
          abi: quiltAbi,
          functionName: "pay",
          args: [splitId],
          value: parsed.wei,
          account: wallet.address!,
        }),
        publicClient!.getGasPrice(),
      ]);
      return gas * price;
    },
  });

  if (!QUILT_ADDRESS)
    return <Notice title="Contract not configured" body="This build has no QuiltSplits address for Bohr testnet, so it refuses to guess one." />;
  if (!valid)
    return <Notice title="Split not found" body="Split ids are positive whole numbers, like /s/2." action={<Link className="btn btn-primary" href="/">Back home</Link>} />;
  if (splitQ.isPending)
    return (
      <div className="mx-auto max-w-[760px] space-y-4 px-5 py-8" aria-busy="true">
        <div className="skeleton h-10 w-48" />
        <div className="skeleton h-48" />
        <div className="skeleton h-40" />
      </div>
    );
  if (splitQ.isError) {
    const missing = /SplitNotFound/.test(String((splitQ.error as Error).message));
    return missing ? (
      <Notice
        title={`Split #${raw} doesn't exist`}
        body="Nothing is registered under this id on the Quilt contract. Check the link or create a new split."
        action={<Link className="btn btn-primary" href="/create">Create a split</Link>}
      />
    ) : (
      <Notice
        title="Couldn't read the split"
        body="The Bohr RPC didn't answer. This isn't a problem with the split."
        action={<button className="btn btn-primary" onClick={() => splitQ.refetch()}>Try again</button>}
      />
    );
  }

  const split = splitQ.data as SplitView;
  const tooSmall = parsed.wei > 0n && quoteQ.isError;
  const insufficient = !!balance && parsed.wei > 0n && balance.value < parsed.wei;
  const confirmed = state.phase === "confirmed" ? state : null;
  const paidLogs = confirmed
    ? parseEventLogs({ abi: quiltAbi, eventName: "RecipientPaid", logs: confirmed.receipt.logs }).filter((l) => l.args.splitId === splitId)
    : [];
  const busy = state.phase === "awaiting" || state.phase === "pending";
  const shareUrl = typeof window === "undefined" ? `/s/${raw}` : `${window.location.origin}/s/${raw}`;

  async function pay() {
    const receipt = await run({ address: QUILT_ADDRESS!, abi: quiltAbi as never, functionName: "pay", args: [splitId], value: parsed.wei });
    if (receipt) {
      await qc.invalidateQueries();
      setAmount("");
    }
  }

  return (
    <div className="rise mx-auto max-w-[760px] px-5 pb-8 pt-4 md:px-0">
      <p className="label text-stone">SPLIT #{raw} · {BOHR_TESTNET.name.toUpperCase()}</p>
      <h1 className="h2 mt-2">
        Pay <b>{split.recipients.length}</b> people <span className="font-light">at once.</span>
      </h1>
      <p className="mt-4 text-slate">
        These shares are fixed on-chain and can&apos;t be changed. One payment sends each recipient their exact share in the same transaction.
      </p>

      <section className="mt-8" aria-labelledby="rcpt">
        <h2 id="rcpt" className="label mb-3 text-stone">RECIPIENTS</h2>
        <RecipientList
          recipients={split.recipients}
          weightsBps={split.weightsBps}
          amounts={quoteQ.isSuccess ? (quoteQ.data as readonly bigint[]) : undefined}
        />
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="tile bg-white">
            <p className="label text-stone">TOTAL PAID</p>
            <p className="numeral mt-1 text-[32px] leading-10" data-testid="total-paid">
              {formatBot(split.totalPaid, 8)}
              <span className="label ml-1 text-stone">{BOHR_TESTNET.currency}</span>
            </p>
          </div>
          <div className="tile bg-white">
            <p className="label text-stone">PAYMENTS</p>
            <p className="numeral mt-1 text-[32px] leading-10" data-testid="payment-count">{split.paymentCount.toString()}</p>
          </div>
        </div>
        <p className="label mt-3 text-stone">Created by {shortAddr(split.creator)}</p>
      </section>

      <section className="glass mt-8 p-6 md:p-8" aria-labelledby="payh">
        <h2 id="payh" className="h3">Pay with {BOHR_TESTNET.currency}</h2>
        <label htmlFor="amt" className="label mt-5 block text-stone">AMOUNT</label>
        <div className="capsule mt-2" style={{ height: 56 }}>
          <input
            id="amt"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.001"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              if (!busy) reset();
            }}
            aria-invalid={!!parsed.error || tooSmall}
          />
          <span className="label pr-4 text-stone">{BOHR_TESTNET.currency}</span>
        </div>
        {parsed.error ? <p className="mt-2 text-[15px] text-[#b42318]" role="alert">{parsed.error}</p> : null}
        {tooSmall ? <p className="mt-2 text-[15px] text-[#b42318]" role="alert">{describeError(quoteQ.error).message}</p> : null}
        {quoteQ.isFetching && parsed.wei > 0n ? <p className="label mt-2 text-stone">Asking the contract for exact amounts...</p> : null}
        {quoteQ.isSuccess ? (
          <p className="label mt-2 text-stone">Exact amounts above come from the contract&apos;s own quote. The last recipient receives the remainder.</p>
        ) : null}

        {ready ? (
          <p className="label mt-3 text-slate">
            Estimated network fee: {feeQ.isSuccess ? `${formatBot(feeQ.data, 8)} ${BOHR_TESTNET.currency}` : feeQ.isError ? "unavailable" : "estimating..."}. Paid separately from the amount.
          </p>
        ) : null}
        {insufficient ? (
          <p className="mt-2 text-[15px] text-[#b42318]" role="alert">
            Your balance is {formatEther(balance!.value).slice(0, 10)} {BOHR_TESTNET.currency}, which is less than this amount.
          </p>
        ) : null}

        <div className="mt-6">
          {!wallet.mounted ? null : !wallet.isConnected ? (
            <div>
              <button className="btn btn-primary w-full sm:w-auto" onClick={wallet.connect} disabled={wallet.connecting}>
                {wallet.connecting ? "Connecting..." : "Connect wallet to pay"}
              </button>
              {!wallet.hasProvider ? (
                <p className="mt-2 text-[15px] text-slate">No browser wallet detected. Install MetaMask or another EVM wallet, then reload.</p>
              ) : null}
              {wallet.connectError ? <p className="mt-2 text-[15px] text-[#b42318]" role="alert">{describeError(wallet.connectError).message}</p> : null}
            </div>
          ) : wallet.wrongNetwork ? (
            <div>
              <button className="btn btn-primary w-full sm:w-auto" onClick={wallet.switchNetwork} disabled={wallet.switching}>
                {wallet.switching ? "Switching..." : "Switch to Bohr testnet"}
              </button>
              {wallet.switchError ? <p className="mt-2 text-[15px] text-[#b42318]" role="alert">{describeError(wallet.switchError).message}</p> : null}
            </div>
          ) : (
            <button className="btn btn-primary w-full sm:w-auto" onClick={pay} disabled={busy || !ready || insufficient}>
              {busy ? "Paying..." : ready ? `Pay ${amount.trim()} ${BOHR_TESTNET.currency}` : "Enter an amount"}
            </button>
          )}
        </div>

        <TxPanel state={state} onReset={reset} pendingLabel="Pending. Waiting for the block" doneLabel="Paid. Confirmed on-chain" />

        {confirmed ? (
          <div className="mt-4">
            <h3 className="label mb-2 text-stone">PAID IN THIS TRANSACTION</h3>
            <RecipientList
              recipients={paidLogs.map((l) => l.args.recipient!)}
              weightsBps={paidLogs.map((l) => {
                const i = split.recipients.findIndex((r) => r.toLowerCase() === l.args.recipient!.toLowerCase());
                return i >= 0 ? split.weightsBps[i] : 0;
              })}
              amounts={paidLogs.map((l) => l.args.amount!)}
            />
          </div>
        ) : null}
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <CopyButton text={shareUrl} label="Copy share link" />
        <Link className="btn btn-ghost btn-sm" href="/create">Create your own</Link>
      </div>
      <p className="label mt-3 text-stone">{bpsToPercent(split.weightsBps.reduce((a, b) => a + b, 0))}% allocated across {split.recipients.length} recipients.</p>
    </div>
  );
}
