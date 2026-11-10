// DEV ONLY local test signer for browser journeys on Bohr testnet (968).
// Exposes an EIP-1193 provider (served at /provider.js) so the real wagmi
// injected-connector path can be exercised without a browser extension.
// Keys stay in this process (read from .env, never sent to the page).
// Binds to 127.0.0.1, answers only chain 968, and only signs transactions
// addressed to the Quilt contract. Not part of any production build.
//
// Usage: node scripts/dev-wallet.mjs   (then set NEXT_PUBLIC_DEV_WALLET_URL=http://127.0.0.1:8545)
import "dotenv/config";
if (process.env.NODE_ENV === "production" || process.env.VERCEL) throw new Error("dev wallet refuses to run in production");
import http from "node:http";
import { createWalletClient, http as viemHttp, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const PORT = Number(process.env.DEV_WALLET_PORT ?? 8545);
const ORIGIN = process.env.DEV_WALLET_ORIGIN ?? "http://localhost:3000";
const RPC = process.env.BOHR_RPC_URL ?? "https://rpc.bohr.life";
const QUILT = (process.env.NEXT_PUBLIC_QUILT_CONTRACT_ADDRESS_968 ?? "").toLowerCase();
if (!/^0x[0-9a-f]{40}$/.test(QUILT)) throw new Error("NEXT_PUBLIC_QUILT_CONTRACT_ADDRESS_968 is not set");

const chain = defineChain({ id: 968, name: "Bohr", nativeCurrency: { name: "tBOT", symbol: "tBOT", decimals: 18 }, rpcUrls: { default: { http: [RPC] } } });
const keys = { deployer: process.env.DEPLOYER_PRIVATE_KEY, payer: process.env.PAYER_PRIVATE_KEY };
const accounts = Object.fromEntries(Object.entries(keys).filter(([, k]) => k).map(([r, k]) => [r, privateKeyToAccount(k.startsWith("0x") ? k : `0x${k}`)]));
const clients = Object.fromEntries(Object.entries(accounts).map(([r, a]) => [r, createWalletClient({ account: a, chain, transport: viemHttp(RPC) })]));

const READ = new Set(["eth_call", "eth_estimateGas", "eth_getBalance", "eth_blockNumber", "eth_getTransactionReceipt", "eth_getTransactionByHash", "eth_gasPrice", "eth_getBlockByNumber", "eth_getCode", "eth_getTransactionCount", "eth_feeHistory", "eth_maxPriorityFeePerGas", "net_version"]);

const providerJs = `(() => {
  if (!["localhost", "127.0.0.1"].includes(location.hostname)) return;
  const BRIDGE = ${JSON.stringify(`http://127.0.0.1:${PORT}`)};
  const role = () => { try { return localStorage.getItem("quilt-dev-role") || "deployer"; } catch { return "deployer"; } };
  const rejectNext = () => { try { return localStorage.getItem("quilt-dev-reject") === "1"; } catch { return false; } };
  const listeners = {};
  const emit = (e, ...a) => (listeners[e] || []).forEach((f) => f(...a));
  const provider = {
    isQuiltDevWallet: true,
    on(e, f) { (listeners[e] ||= []).push(f); return provider; },
    removeListener(e, f) { listeners[e] = (listeners[e] || []).filter((x) => x !== f); return provider; },
    async request({ method, params }) {
      if (method === "eth_sendTransaction" && rejectNext()) {
        try { localStorage.removeItem("quilt-dev-reject"); } catch {}
        const e = new Error("User rejected the request."); e.code = 4001; throw e;
      }
      const res = await fetch(BRIDGE + "/rpc?role=" + role(), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ method, params: params || [] }) });
      const j = await res.json();
      if (j.error) { const e = new Error(j.error.message); e.code = j.error.code; throw e; }
      if (method === "eth_requestAccounts") emit("connect", { chainId: "0x3c8" });
      return j.result;
    },
  };
  window.ethereum = provider;
})();`;

function send(res, code, body, type = "application/json") {
  res.writeHead(code, { "content-type": type, "access-control-allow-origin": ORIGIN, "access-control-allow-headers": "content-type", "access-control-allow-methods": "POST,GET,OPTIONS" });
  res.end(body);
}

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
    if (req.method === "OPTIONS") return send(res, 204, "");
    if (url.pathname === "/provider.js") return send(res, 200, providerJs, "text/javascript");
    if (url.pathname !== "/rpc" || req.method !== "POST") return send(res, 404, "{}");
    // Reject DNS rebinding and any caller that is not the local app.
    if (!/^(127\.0\.0\.1|localhost):\d+$/.test(req.headers.host ?? "")) return send(res, 403, "{}");
    if (req.headers.origin !== ORIGIN) return send(res, 403, JSON.stringify({ error: { code: -32000, message: "origin not allowed" } }));
    const role = url.searchParams.get("role") === "payer" ? "payer" : "deployer";
    let raw = "";
    for await (const c of req) raw += c;
    const { method, params } = JSON.parse(raw);
    const fail = (code, message) => send(res, 200, JSON.stringify({ error: { code, message } }));
    const ok = (result) => send(res, 200, JSON.stringify({ result }));
    try {
      const account = accounts[role];
      if (!account) return fail(-32000, `no key for role ${role}`);
      if (method === "eth_chainId") return ok("0x3c8");
      if (method === "eth_accounts") return ok([]);
      if (method === "eth_requestAccounts") return ok([account.address]);
      if (method === "wallet_switchEthereumChain") return params[0].chainId === "0x3c8" ? ok(null) : fail(4902, "only chain 968");
      if (method === "wallet_getPermissions" || method === "wallet_requestPermissions") return ok([]);
      if (method === "eth_sendTransaction") {
        const tx = params[0];
        if (String(tx.to).toLowerCase() !== QUILT) return fail(-32602, "dev wallet signs only Quilt contract calls");
        const hash = await clients[role].sendTransaction({ to: tx.to, data: tx.data, value: tx.value ? BigInt(tx.value) : 0n });
        return ok(hash);
      }
      if (READ.has(method)) {
        const r = await fetch(RPC, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
        const j = await r.json();
        return j.error ? fail(j.error.code, j.error.message) : ok(j.result);
      }
      return fail(-32601, `method not supported by dev wallet: ${method}`);
    } catch (e) {
      return fail(-32000, e.shortMessage ?? e.message);
    }
  })
  .listen(PORT, "127.0.0.1", () => console.log(`dev wallet on http://127.0.0.1:${PORT} (roles: ${Object.keys(accounts).join(", ")})`));
