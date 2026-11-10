"use client";
import Link from "next/link";
import { usePublicClient } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { quiltAbi } from "@/lib/quilt-abi";
import { CHAIN_ID, QUILT_ADDRESS, formatBot, shortAddr, type SplitView } from "@/lib/contract";
import { BOHR_TESTNET } from "@/lib/chains";
import { useQuiltWallet } from "@/lib/hooks";
import { CopyButton } from "@/components/CopyButton";

type Item = { id: bigint; split: SplitView };

export function DashboardClient() {
  const wallet = useQuiltWallet();
  const publicClient = usePublicClient({ chainId: CHAIN_ID });
  const address = wallet.address;

  const q = useQuery({
    queryKey: ["dashboard", address],
    enabled: !!address && !!publicClient && !!QUILT_ADDRESS,
    retry: 1,
    queryFn: async (): Promise<Item[]> => {
      const ids = (await publicClient!.readContract({
        address: QUILT_ADDRESS!,
        abi: quiltAbi,
        functionName: "getCreatorSplitIds",
        args: [address!],
      })) as readonly bigint[];
      // One read per split. No event-log queries, and Bohr has no multicall3.
      const splits = await Promise.all(
        ids.map((id) =>
          publicClient!.readContract({ address: QUILT_ADDRESS!, abi: quiltAbi, functionName: "getSplit", args: [id] }),
        ),
      );
      return ids.map((id, i) => ({ id, split: splits[i] as SplitView })).reverse();
    },
  });

  const items = q.data ?? [];
  const totalPaid = items.reduce((a, b) => a + b.split.totalPaid, 0n);
  const totalCount = items.reduce((a, b) => a + b.split.paymentCount, 0n);

  return (
    <div className="rise mx-auto max-w-[1000px] px-5 pb-8 pt-4 md:px-12">
      <p className="label text-stone">CREATOR DASHBOARD · {BOHR_TESTNET.name.toUpperCase()}</p>
      <h1 className="h2 mt-2">Your <b>splits.</b></h1>

      {!QUILT_ADDRESS ? (
        <p className="mt-6 text-slate" role="alert">Contract address isn&apos;t configured for this build.</p>
      ) : !wallet.mounted ? (
        <div className="skeleton mt-8 h-40" />
      ) : !wallet.isConnected ? (
        <div className="glass mt-8 p-10 text-center">
          <h2 className="h3">Connect to see your splits</h2>
          <p className="mt-3 text-slate">Your dashboard reads the splits created by your wallet straight from the contract.</p>
          <div className="mt-6 flex justify-center">
            <button className="btn btn-primary" onClick={wallet.connect} disabled={wallet.connecting}>{wallet.connecting ? "Connecting..." : "Connect wallet"}</button>
          </div>
          {!wallet.hasProvider ? <p className="mt-3 text-[15px] text-slate">No browser wallet detected. Install MetaMask or another EVM wallet, then reload.</p> : null}
        </div>
      ) : q.isPending ? (
        <div className="mt-8 space-y-4" aria-busy="true"><div className="skeleton h-28" /><div className="skeleton h-28" /></div>
      ) : q.isError ? (
        <div className="glass mt-8 p-10 text-center" role="alert">
          <h2 className="h3">Couldn&apos;t load your splits</h2>
          <p className="mt-3 text-slate">The Bohr RPC didn&apos;t answer. Your splits are safe on-chain.</p>
          <div className="mt-6 flex justify-center"><button className="btn btn-primary" onClick={() => q.refetch()}>Try again</button></div>
        </div>
      ) : items.length === 0 ? (
        <div className="glass mt-8 p-10 text-center">
          <h2 className="h3">No splits yet</h2>
          <p className="mt-3 text-slate">{shortAddr(address ?? "")} hasn&apos;t created a split on this contract.</p>
          <div className="mt-6 flex justify-center"><Link className="btn btn-primary" href="/create">Create your first split</Link></div>
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="tile bg-white"><p className="label text-stone">SPLITS</p><p className="numeral mt-1 text-[40px] leading-[44px]">{items.length}</p></div>
            <div className="tile bg-[#d9ccf5]"><p className="label text-slate">TOTAL PAID</p><p className="numeral mt-1 text-[40px] leading-[44px]" data-testid="dash-total">{formatBot(totalPaid, 8)}</p><p className="label text-slate">{BOHR_TESTNET.currency}</p></div>
            <div className="tile bg-violet text-white"><p className="label text-white/80">PAYMENTS</p><p className="numeral mt-1 text-[40px] leading-[44px]" data-testid="dash-count">{totalCount.toString()}</p></div>
          </div>
          <ul className="mt-6 space-y-4">
            {items.map(({ id, split }) => (
              <li key={id.toString()} className="tile flex flex-col gap-4 bg-white sm:flex-row sm:items-center sm:justify-between" data-testid={`split-${id}`}>
                <div>
                  <p className="h3">Split #{id.toString()}</p>
                  <p className="label text-stone">{split.recipients.length} recipients</p>
                </div>
                <div className="flex gap-8">
                  <div><p className="label text-stone">PAID</p><p className="numeral text-[20px]">{formatBot(split.totalPaid, 8)} {BOHR_TESTNET.currency}</p></div>
                  <div><p className="label text-stone">PAYMENTS</p><p className="numeral text-[20px]">{split.paymentCount.toString()}</p></div>
                </div>
                <div className="flex gap-2">
                  <Link className="btn btn-primary btn-sm" href={`/s/${id}`}>Open</Link>
                  <CopyButton text={`${typeof window === "undefined" ? "" : window.location.origin}/s/${id}`} label="Link" />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
