import Link from "next/link";
import { QUILT_ADDRESS } from "@/lib/contract";
import { BOHR_TESTNET } from "@/lib/chains";

export function Footer() {
  return (
    <footer className="mt-[120px] border-t border-black/[0.06]">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-5 py-12 text-[15px] text-slate md:flex-row md:items-center md:justify-between md:px-12">
        <div>
          <p className="text-[22px] font-bold text-ink">quilt.</p>
          <p className="mt-1">Built on BOT Chain. Running on {BOHR_TESTNET.name} (chain {BOHR_TESTNET.id}).</p>
        </div>
        <ul className="flex flex-wrap gap-x-6 gap-y-2 font-medium text-ink">
          <li><a className="hover:text-violet" href="https://botchain.ai" target="_blank" rel="noopener noreferrer">BOT Chain</a></li>
          <li><a className="hover:text-violet" href="https://scan.botchain.ai" target="_blank" rel="noopener noreferrer">BOT Scan</a></li>
          {QUILT_ADDRESS ? (
            <li><a className="hover:text-violet" href={`${BOHR_TESTNET.explorerUrl}/address/${QUILT_ADDRESS}`} target="_blank" rel="noopener noreferrer">Contract on testnet</a></li>
          ) : null}
          <li><Link className="hover:text-violet" href="/create">Create a split</Link></li>
        </ul>
      </div>
    </footer>
  );
}
