"use client";
import { Wallet } from "lucide-react";
import { CHAIN, shortAddr } from "@/lib/contract";
import { useQuiltWallet } from "@/lib/hooks";

export function WalletButton() {
  const w = useQuiltWallet();
  if (!w.mounted) return <span className="btn btn-dark btn-sm opacity-0" aria-hidden>Connect</span>;
  if (!w.isConnected) {
    return (
      <button className="btn btn-dark btn-sm" onClick={w.connect} disabled={w.connecting}>
        <Wallet size={16} /> {w.connecting ? "Connecting..." : "Connect wallet"}
      </button>
    );
  }
  return (
    <div className="flex items-center gap-2">
      {w.wrongNetwork ? (
        <button className="btn btn-primary btn-sm" onClick={w.switchNetwork} disabled={w.switching}>
          {w.switching ? "Switching..." : `Switch to ${CHAIN.name}`}
        </button>
      ) : null}
      <button className="btn btn-dark btn-sm numeral" onClick={() => w.disconnect()} title="Disconnect" aria-label="Disconnect wallet">
        {shortAddr(w.address ?? "")}
      </button>
    </div>
  );
}
