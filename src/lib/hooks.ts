"use client";
import { useCallback, useState, useSyncExternalStore } from "react";
import { useAccount, useConnect, useDisconnect, usePublicClient, useSwitchChain, useWalletClient } from "wagmi";
import type { Abi, Hash, TransactionReceipt } from "viem";
import { CHAIN_ID } from "./contract";
import { describeError } from "./contract";

const noop = () => () => {};
export function useMounted() {
  return useSyncExternalStore(noop, () => true, () => false);
}

export function useQuiltWallet() {
  const mounted = useMounted();
  const { address, isConnected, chainId } = useAccount();
  const { connectors, connect, isPending: connecting, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: switching, error: switchError } = useSwitchChain();
  const hasProvider = mounted && typeof window !== "undefined" && "ethereum" in window;
  return {
    mounted,
    address: mounted ? address : undefined,
    isConnected: mounted && isConnected,
    wrongNetwork: mounted && isConnected && chainId !== CHAIN_ID,
    hasProvider,
    connecting,
    switching,
    connectError,
    switchError,
    connect: () => connect({ connector: connectors[0], chainId: CHAIN_ID }),
    disconnect,
    switchNetwork: () => switchChain({ chainId: CHAIN_ID }),
  };
}

export type TxState =
  | { phase: "idle" }
  | { phase: "awaiting" }
  | { phase: "pending"; hash: Hash }
  | { phase: "confirmed"; hash: Hash; receipt: TransactionReceipt }
  | { phase: "failed"; message: string; hash?: Hash }
  | { phase: "rejected"; message: string };

type WriteArgs = {
  address: `0x${string}`;
  abi: Abi;
  functionName: string;
  args: readonly unknown[];
  value?: bigint;
};

/** simulate -> wallet write -> receipt. Real chain calls only. */
export function useQuiltTx() {
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId: CHAIN_ID });
  const { data: walletClient } = useWalletClient({ chainId: CHAIN_ID });
  const [state, setState] = useState<TxState>({ phase: "idle" });

  const run = useCallback(
    async (w: WriteArgs): Promise<TransactionReceipt | null> => {
      if (!publicClient || !walletClient || !address) {
        setState({ phase: "failed", message: "Wallet is not ready. Reconnect and try again." });
        return null;
      }
      let hash: Hash | undefined;
      try {
        setState({ phase: "awaiting" });
        const { request } = await publicClient.simulateContract({ ...w, account: address } as never);
        hash = await walletClient.writeContract(request as never);
        setState({ phase: "pending", hash });
        const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 120_000 });
        if (receipt.status !== "success") {
          setState({ phase: "failed", message: "The transaction was mined but reverted. No funds moved.", hash });
          return null;
        }
        setState({ phase: "confirmed", hash, receipt });
        return receipt;
      } catch (err) {
        const d = describeError(err);
        setState(d.kind === "rejected" ? { phase: "rejected", message: d.message } : { phase: "failed", message: d.message, hash });
        return null;
      }
    },
    [publicClient, walletClient, address],
  );

  return { state, run, reset: () => setState({ phase: "idle" }) };
}
