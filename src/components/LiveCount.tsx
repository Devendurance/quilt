"use client";
import { useReadContract } from "wagmi";
import { quiltAbi } from "@/lib/quilt-abi";
import { CHAIN_ID, QUILT_ADDRESS } from "@/lib/contract";

/** Real on-chain count of splits ever created (nextSplitId - 1). */
export function LiveCount() {
  const { data, isPending, isError } = useReadContract({
    address: QUILT_ADDRESS ?? undefined,
    abi: quiltAbi,
    functionName: "nextSplitId",
    chainId: CHAIN_ID,
    query: { enabled: !!QUILT_ADDRESS },
  });
  if (isPending) return <span className="skeleton inline-block h-10 w-16 align-middle" aria-label="Loading" />;
  if (isError || data === undefined) return <span aria-label="Unavailable">-</span>;
  return <span data-testid="live-count">{(data - 1n).toString()}</span>;
}
