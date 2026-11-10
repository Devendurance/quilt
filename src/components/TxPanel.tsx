import { CheckCircle2, Loader2, XCircle, Ban, ExternalLink } from "lucide-react";
import type { TxState } from "@/lib/hooks";
import { txUrl } from "@/lib/chains";
import { CHAIN_ID } from "@/lib/contract";

export function TxPanel({ state, pendingLabel, doneLabel, doneTone = "ok", onReset }: { state: TxState; pendingLabel: string; doneLabel: string; doneTone?: "ok" | "warn"; onReset: () => void }) {
  if (state.phase === "idle") return null;
  const link = "hash" in state && state.hash ? txUrl(CHAIN_ID, state.hash) : null;
  const base = "mt-6 rounded-[20px] border p-5 text-[15px] leading-6";
  const explorer = link ? (
    <a className="mt-2 inline-flex items-center gap-1 font-medium text-violet hover:text-violet-deep" href={link} target="_blank" rel="noopener noreferrer">
      View on BOT Scan <ExternalLink size={14} />
    </a>
  ) : null;
  const hashLine = "hash" in state && state.hash ? <p className="label mt-1 break-all text-slate">{state.hash}</p> : null;

  if (state.phase === "awaiting")
    return (
      <div role="status" className={`${base} border-black/10 bg-white`}>
        <p className="flex items-center gap-2 font-medium"><Loader2 className="animate-spin" size={18} /> Confirm in your wallet</p>
        <p className="mt-1 text-slate">Simulated on-chain first. Nothing is sent until you approve.</p>
      </div>
    );
  if (state.phase === "pending")
    return (
      <div role="status" className={`${base} border-violet/30 bg-white`}>
        <p className="flex items-center gap-2 font-medium"><Loader2 className="animate-spin" size={18} /> {pendingLabel}</p>
        {hashLine}{explorer}
      </div>
    );
  if (state.phase === "confirmed")
    return (
      <div role="status" className={`${base} ${doneTone === "ok" ? "border-[#1a7f4b]/30" : "border-[#b42318]/30"} bg-white`}>
        <p className={`flex items-center gap-2 font-medium ${doneTone === "ok" ? "text-[#1a7f4b]" : "text-[#b42318]"}`}><CheckCircle2 size={18} /> {doneLabel}</p>
        {hashLine}{explorer}
      </div>
    );
  if (state.phase === "rejected")
    return (
      <div role="alert" className={`${base} border-black/10 bg-white`}>
        <p className="flex items-center gap-2 font-medium"><Ban size={18} /> Rejected</p>
        <p className="mt-1 text-slate">{state.message}</p>
        <button className="mt-2 font-medium text-violet hover:text-violet-deep" onClick={onReset}>Dismiss</button>
      </div>
    );
  return (
    <div role="alert" className={`${base} border-[#b42318]/30 bg-white`}>
      <p className="flex items-center gap-2 font-medium text-[#b42318]"><XCircle size={18} /> Failed</p>
      <p className="mt-1 text-slate">{state.message}</p>
      {hashLine}{explorer}
      <button className="mt-2 block font-medium text-violet hover:text-violet-deep" onClick={onReset}>Dismiss</button>
    </div>
  );
}
