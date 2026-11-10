import { CHAIN, bpsToPercent, formatBot, shortAddr } from "@/lib/contract";

export function RecipientList({ recipients, weightsBps, amounts }: { recipients: readonly string[]; weightsBps: readonly number[]; amounts?: readonly bigint[] }) {
  return (
    <ul className="divide-y divide-black/[0.06] rounded-[20px] border border-black/[0.06] bg-white">
      {recipients.map((r, i) => (
        <li key={r} className="flex items-center justify-between gap-4 px-5 py-4">
          <div className="min-w-0">
            <a href={`${CHAIN.explorerUrl}/address/${r}`} target="_blank" rel="noopener noreferrer" className="numeral block truncate text-[15px] hover:text-violet" title={r}>
              <span className="sm:hidden">{shortAddr(r)}</span><span className="hidden sm:inline">{r}</span>
            </a>
            <span className="label text-stone">{bpsToPercent(weightsBps[i])}%</span>
          </div>
          {amounts ? <span className="numeral shrink-0 text-[18px]">{formatBot(amounts[i], 8)} <span className="label text-stone">{CHAIN.currency}</span></span> : null}
        </li>
      ))}
    </ul>
  );
}
