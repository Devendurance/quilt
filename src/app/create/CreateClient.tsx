"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { isAddress, parseEventLogs } from "viem";
import { Plus, Trash2 } from "lucide-react";
import { quiltAbi } from "@/lib/quilt-abi";
import { QUILT_ADDRESS, bpsToPercent, describeError, shortAddr } from "@/lib/contract";
import { BOHR_TESTNET } from "@/lib/chains";
import { useQuiltTx, useQuiltWallet } from "@/lib/hooks";
import { TxPanel } from "@/components/TxPanel";
import { CopyButton } from "@/components/CopyButton";

type Row = { address: string; percent: string };
const ZERO = "0x0000000000000000000000000000000000000000";

/** Percent string to integer bps. Null when not a number with at most 2 decimals. */
function toBps(p: string): number | null {
  const t = p.trim();
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(t)) return null;
  const [w, f = ""] = t.split(".");
  return Number(w) * 100 + Number(f.padEnd(2, "0"));
}

export function CreateClient() {
  const wallet = useQuiltWallet();
  const { state, run, reset } = useQuiltTx();
  const [rows, setRows] = useState<Row[]>([
    { address: "", percent: "" },
    { address: "", percent: "" },
  ]);
  const [reviewing, setReviewing] = useState(false);
  const [ack, setAck] = useState(false);
  const [newId, setNewId] = useState<bigint | null>(null);

  const check = useMemo(() => {
    const bps = rows.map((r) => toBps(r.percent));
    const total = bps.reduce<number>((a, b) => a + (b ?? 0), 0);
    const seen = new Set<string>();
    const rowErrors = rows.map((r, i) => {
      const a = r.address.trim();
      if (a === "" && r.percent.trim() === "") return null;
      if (a === "") return "Enter a recipient address.";
      if (!isAddress(a, { strict: false })) return "Not a valid 0x address.";
      if (a.toLowerCase() === ZERO) return "The zero address can't receive payments.";
      if (seen.has(a.toLowerCase())) return "Duplicate address. Each recipient must be unique.";
      seen.add(a.toLowerCase());
      if (bps[i] === null) return "Share must be a percent with up to 2 decimals.";
      if (bps[i] === 0) return "Share must be above 0%.";
      return null;
    });
    const complete = rows.every((r) => r.address.trim() !== "" && r.percent.trim() !== "");
    const ok = complete && rowErrors.every((e) => e === null) && total === 10000 && rows.length >= 2 && rows.length <= 5;
    return { bps: bps as number[], total, rowErrors, ok };
  }, [rows]);

  const update = (i: number, patch: Partial<Row>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const evenly = () =>
    setRows((rs) => {
      const n = rs.length;
      const base = Math.floor(10000 / n);
      return rs.map((r, i) => ({ ...r, percent: ((i === n - 1 ? 10000 - base * (n - 1) : base) / 100).toString() }));
    });

  const busy = state.phase === "awaiting" || state.phase === "pending";
  const remaining = 10000 - check.total;

  async function create() {
    const receipt = await run({
      address: QUILT_ADDRESS!,
      abi: quiltAbi as never,
      functionName: "createSplit",
      args: [rows.map((r) => r.address.trim() as `0x${string}`), check.bps],
    });
    if (receipt) {
      const ev = parseEventLogs({ abi: quiltAbi, eventName: "SplitCreated", logs: receipt.logs });
      setNewId(ev[0]?.args.splitId ?? null);
    }
  }

  if (!QUILT_ADDRESS)
    return (
      <div className="glass mx-auto my-8 max-w-[760px] p-10 text-center" role="alert">
        <h1 className="h3">Contract not configured</h1>
        <p className="mt-3 text-slate">This build has no QuiltSplits address for Bohr testnet, so it refuses to guess one.</p>
      </div>
    );

  if (newId !== null) {
    const url = `${typeof window === "undefined" ? "" : window.location.origin}/s/${newId}`;
    return (
      <div className="rise mx-auto max-w-[760px] px-5 pb-8 pt-4 md:px-0">
        <p className="label text-stone">SPLIT CREATED</p>
        <h1 className="h2 mt-2">Split <b>#{newId.toString()}</b> <span className="font-light">is live.</span></h1>
        <p className="mt-4 text-slate">It&apos;s permanent. Share this link with anyone who should pay it.</p>
        <div className="capsule mt-6" style={{ height: 64 }}>
          <input readOnly value={url} aria-label="Share link" onFocus={(e) => e.currentTarget.select()} />
          <CopyButton text={url} label="Copy" className="btn btn-primary" />
        </div>
        <TxPanel state={state} onReset={reset} pendingLabel="Pending" doneLabel="Split created. Confirmed on-chain" />
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="btn btn-primary" href={`/s/${newId}`}>Open split page</Link>
          <Link className="btn btn-ghost" href="/dashboard">Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rise mx-auto max-w-[760px] px-5 pb-8 pt-4 md:px-0">
      <p className="label text-stone">NEW SPLIT · {BOHR_TESTNET.name.toUpperCase()}</p>
      <h1 className="h2 mt-2">Create a <b>split.</b></h1>
      <p className="mt-4 text-slate">Add 2 to 5 recipients and give each a share. Shares must total exactly 100%.</p>

      {!reviewing ? (
        <form
          className="mt-8"
          onSubmit={(e) => {
            e.preventDefault();
            if (check.ok) setReviewing(true);
          }}
        >
          <ul className="space-y-4">
            {rows.map((r, i) => (
              <li key={i} className="glass p-4 md:p-5">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="flex-1">
                    <label className="label text-stone" htmlFor={`addr-${i}`}>RECIPIENT {i + 1}</label>
                    <input id={`addr-${i}`} className="field mt-1" placeholder="0x..." spellCheck={false} autoComplete="off" value={r.address} aria-invalid={!!check.rowErrors[i]} onChange={(e) => update(i, { address: e.target.value })} />
                  </div>
                  <div className="sm:w-36">
                    <label className="label text-stone" htmlFor={`pct-${i}`}>SHARE %</label>
                    <input id={`pct-${i}`} className="field mt-1" inputMode="decimal" placeholder="50" value={r.percent} aria-invalid={!!check.rowErrors[i]} onChange={(e) => update(i, { percent: e.target.value })} />
                  </div>
                  {rows.length > 2 ? (
                    <button type="button" className="btn btn-ghost btn-sm self-end" aria-label={`Remove recipient ${i + 1}`} onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}>
                      <Trash2 size={16} />
                    </button>
                  ) : null}
                </div>
                {check.rowErrors[i] ? <p className="mt-2 text-[15px] text-[#b42318]" role="alert">{check.rowErrors[i]}</p> : null}
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {rows.length < 5 ? (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRows((rs) => [...rs, { address: "", percent: "" }])}>
                <Plus size={16} /> Add recipient
              </button>
            ) : null}
            <button type="button" className="btn btn-ghost btn-sm" onClick={evenly}>Split evenly</button>
            <span className={`numeral ml-auto text-[18px] ${remaining === 0 ? "text-violet" : remaining < 0 ? "text-[#b42318]" : "text-slate"}`} aria-live="polite" data-testid="total">
              {bpsToPercent(check.total)}% of 100%
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/[0.06]" aria-hidden>
            <div className="h-full rounded-full bg-violet transition-all" style={{ width: `${Math.min(100, check.total / 100)}%` }} />
          </div>
          {remaining !== 0 ? (
            <p className="label mt-2 text-stone">{remaining > 0 ? `${bpsToPercent(remaining)}% left to allocate.` : `${bpsToPercent(-remaining)}% over. Reduce a share.`}</p>
          ) : null}

          <button type="submit" className="btn btn-primary mt-8 w-full sm:w-auto" disabled={!check.ok}>Review split</button>
        </form>
      ) : (
        <div className="mt-8">
          <div className="glass p-6 md:p-8">
            <h2 className="h3">Review. This can&apos;t be edited later.</h2>
            <ul className="mt-5 divide-y divide-black/[0.06] rounded-[20px] border border-black/[0.06] bg-white">
              {rows.map((r, i) => (
                <li key={i} className="flex items-center justify-between gap-3 px-5 py-4">
                  <span className="numeral truncate text-[15px]" title={r.address}>
                    <span className="sm:hidden">{shortAddr(r.address.trim())}</span><span className="hidden sm:inline">{r.address.trim()}</span>
                  </span>
                  <span className="numeral text-[18px]">{bpsToPercent(check.bps[i])}%</span>
                </li>
              ))}
            </ul>
            <label className="mt-5 flex cursor-pointer items-start gap-3 text-[16px] leading-6">
              <input type="checkbox" className="mt-1 h-5 w-5 accent-[#7B5CF0]" checked={ack} onChange={(e) => setAck(e.target.checked)} disabled={busy} />
              <span>I understand these recipients and shares are permanent. No one, including me, can change or delete them.</span>
            </label>

            <div className="mt-6">
              {!wallet.mounted ? null : !wallet.isConnected ? (
                <div>
                  <button className="btn btn-primary" onClick={wallet.connect} disabled={wallet.connecting}>{wallet.connecting ? "Connecting..." : "Connect wallet"}</button>
                  {!wallet.hasProvider ? <p className="mt-2 text-[15px] text-slate">No browser wallet detected. Install MetaMask or another EVM wallet, then reload.</p> : null}
                  {wallet.connectError ? <p className="mt-2 text-[15px] text-[#b42318]" role="alert">{describeError(wallet.connectError).message}</p> : null}
                </div>
              ) : wallet.wrongNetwork ? (
                <div>
                  <button className="btn btn-primary" onClick={wallet.switchNetwork} disabled={wallet.switching}>{wallet.switching ? "Switching..." : "Switch to Bohr testnet"}</button>
                  {wallet.switchError ? <p className="mt-2 text-[15px] text-[#b42318]" role="alert">{describeError(wallet.switchError).message}</p> : null}
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  <button className="btn btn-primary" onClick={create} disabled={!ack || busy}>{busy ? "Creating..." : "Create split permanently"}</button>
                  <button className="btn btn-ghost" onClick={() => { setReviewing(false); setAck(false); reset(); }} disabled={busy}>Back to edit</button>
                </div>
              )}
            </div>
            <TxPanel state={state} onReset={reset} pendingLabel="Pending. Waiting for the block" doneLabel="Confirmed. Reading your new split id" />
            {state.phase === "confirmed" && newId === null ? (
              <p className="mt-3 text-[15px] text-slate" role="alert">The split was created, but the id wasn&apos;t in the receipt. Find it in your <Link className="font-medium text-violet" href="/dashboard">dashboard</Link>.</p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
