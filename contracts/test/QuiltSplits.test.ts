import { expect } from "chai";
import hre from "hardhat";
import {
  decodeErrorResult,
  decodeEventLog,
  type Abi,
  type Address,
} from "viem";
import type {
  PublicClient,
  WalletClient,
} from "@nomicfoundation/hardhat-viem/types";

  async function freshQuilt() {
    return hre.viem.deployContract("QuiltSplits");
  }

  type Quilt = Awaited<ReturnType<typeof freshQuilt>>;

  async function deployRejector() {
    return hre.viem.deployContract("Rejector");
  }

  async function deployAttacker(quiltAddress: Address) {
    return hre.viem.deployContract("ReentrantAttacker", [quiltAddress]);
  }

const BPS = 10_000n;

/// Mirror of the contract's allocation rule: first N-1 shares round down,
/// the last recipient takes the exact remainder.
function expectedShares(amount: bigint, bps: number[]): bigint[] {
  const out: bigint[] = [];
  let accounted = 0n;
  for (let i = 0; i < bps.length - 1; i++) {
    const share = (amount * BigInt(bps[i])) / BPS;
    out.push(share);
    accounted += share;
  }
  out.push(amount - accounted);
  return out;
}

/// Deterministic PRNG (mulberry32) so property sweeps reproduce exactly.
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("QuiltSplits", function () {
  let publicClient: PublicClient;
  let wallets: WalletClient[];
  let quilt: Quilt;

  const addr = (i: number): Address => wallets[i].account.address;

  /**
   * Assert a viem write reverts with a specific contract custom error.
   * Decodes revert data with the contract ABI instead of relying on
   * matcher plugins, so the check is exact and version-independent.
   */
  async function expectCustomError(promise: Promise<unknown>, name: string) {
    try {
      await promise;
    } catch (e: unknown) {
      const seen = new Set<string>();
      const visit = (v: unknown, depth: number): void => {
        if (v === null || typeof v !== "object" || depth > 6) return;
        const o = v as Record<string, unknown>;
        if (typeof o.errorName === "string") seen.add(o.errorName);
        const abiItem = o.abiItem as { name?: unknown } | undefined;
        if (abiItem && typeof abiItem.name === "string") seen.add(abiItem.name);
        if (typeof o.data === "string" && o.data.startsWith("0x")) {
          try {
            seen.add(
              decodeErrorResult({ abi: quilt.abi as Abi, data: o.data as `0x${string}` })
                .errorName ?? ""
            );
          } catch {
            /* revert data from another contract; ignore */
          }
        }
        if (typeof o.message === "string") {
          for (const m of o.message.matchAll(/([A-Za-z_][A-Za-z0-9_]*)\(/g)) {
            seen.add(m[1]);
          }
        }
        visit(o.cause, depth + 1);
      };
      visit(e, 0);
      expect([...seen], `expected custom error ${name}`).to.include(name);
      return;
    }
    throw new Error(`expected custom error ${name} but the call succeeded`);
  }

  /** Contract instance bound to a different signer (independent payer). */
  async function asSigner(signer: WalletClient): Promise<Quilt> {
    // Widened to string: this hardhat-viem version type-blocks mapped
    // contract names on getContractAt. The cast below restores precision;
    // runtime behavior is covered by the passing suite.
    const contractName: string = "QuiltSplits";
    const c = await hre.viem.getContractAt(contractName, quilt.address, {
      client: { public: publicClient, wallet: signer },
    });
    return c as unknown as Quilt;
  }

  async function balanceOf(a: Address): Promise<bigint> {
    return publicClient.getBalance({ address: a });
  }

  /** Decoded events emitted by quilt in a transaction receipt. */
  async function quiltEvents(hash: `0x${string}`) {
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return receipt.logs
      .filter((l) => l.address.toLowerCase() === quilt.address.toLowerCase())
      .map((l) =>
        decodeEventLog({ abi: quilt.abi as Abi, data: l.data, topics: l.topics })
      );
  }

  beforeEach(async function () {
    publicClient = await hre.viem.getPublicClient();
    wallets = await hre.viem.getWalletClients();
    quilt = await freshQuilt();
  });

  describe("createSplit validation", function () {
    it("creates a valid two-recipient 60/40 split with id 1", async function () {
      const hash = await quilt.write.createSplit([[addr(1), addr(2)], [6000, 4000]]);
      const events = await quiltEvents(hash);
      expect(events).to.have.lengthOf(1);
      expect(events[0].eventName).to.equal("SplitCreated");
      const split = await quilt.read.getSplit([1n]);
      expect(split.exists).to.equal(true);
      expect(split.creator.toLowerCase()).to.equal(addr(0).toLowerCase());
      expect([...split.recipients].map((a) => a.toLowerCase())).to.deep.equal(
        [addr(1), addr(2)].map((a) => a.toLowerCase())
      );
      expect([...split.weightsBps]).to.deep.equal([6000, 4000]);
      expect(split.totalPaid).to.equal(0n);
      expect(split.paymentCount).to.equal(0n);
    });

    it("creates a valid five-recipient split", async function () {
      await quilt.write.createSplit([
        [addr(1), addr(2), addr(3), addr(4), addr(5)],
        [2000, 2000, 2000, 2000, 2000],
      ]);
      const split = await quilt.read.getSplit([1n]);
      expect(split.recipients).to.have.lengthOf(5);
      expect(split.exists).to.equal(true);
    });

    it("rejects 0, 1 and 6 recipients", async function () {
      await expectCustomError(quilt.write.createSplit([[], []]), "InvalidRecipientCount");
      await expectCustomError(quilt.write.createSplit([[addr(1)], [10000]]), "InvalidRecipientCount");
      const six = [addr(1), addr(2), addr(3), addr(4), addr(5), addr(6)];
      await expectCustomError(
        quilt.write.createSplit([six, [2000, 2000, 2000, 2000, 1000, 1000]]),
        "InvalidRecipientCount"
      );
    });

    it("rejects duplicate recipients", async function () {
      await expectCustomError(
        quilt.write.createSplit([[addr(1), addr(1)], [5000, 5000]]),
        "DuplicateRecipient"
      );
    });

    it("rejects the zero address", async function () {
      const zero = "0x0000000000000000000000000000000000000000" as Address;
      await expectCustomError(
        quilt.write.createSplit([[addr(1), zero], [5000, 5000]]),
        "ZeroRecipientAddress"
      );
    });

    it("rejects mismatched array lengths", async function () {
      await expectCustomError(
        quilt.write.createSplit([[addr(1), addr(2)], [10000]]),
        "LengthMismatch"
      );
    });

    it("rejects zero weights", async function () {
      await expectCustomError(
        quilt.write.createSplit([[addr(1), addr(2)], [10000, 0]]),
        "InvalidWeight"
      );
    });

    it("rejects totals of 9999 and 10001", async function () {
      await expectCustomError(
        quilt.write.createSplit([[addr(1), addr(2)], [5000, 4999]]),
        "BadTotalWeight"
      );
      await expectCustomError(
        quilt.write.createSplit([[addr(1), addr(2)], [5000, 5001]]),
        "BadTotalWeight"
      );
    });

    it("assigns incrementing ids and isolates creator histories", async function () {
      await quilt.write.createSplit([[addr(3), addr(4)], [5000, 5000]]);
      await quilt.write.createSplit([[addr(3), addr(4)], [7000, 3000]]);
      const other = await asSigner(wallets[5]);
      await other.write.createSplit([[addr(6), addr(7)], [5000, 5000]]);
      expect(await quilt.read.nextSplitId()).to.equal(4n);
      expect(await quilt.read.getCreatorSplitIds([addr(0)])).to.deep.equal([1n, 2n]);
      expect(await quilt.read.getCreatorSplitIds([addr(5)])).to.deep.equal([3n]);
      expect(await quilt.read.getCreatorSplitIds([addr(8)])).to.deep.equal([]);
    });
  });

  describe("views and quotes", function () {
    it("reverts getSplit for an unknown id", async function () {
      await expect(quilt.read.getSplit([999n])).to.be.rejectedWith();
    });

    it("quoteSplit matches the contract math and reverts on bad input", async function () {
      await quilt.write.createSplit([[addr(1), addr(2), addr(3)], [5000, 3000, 2000]]);
      const quote = await quilt.read.quoteSplit([1n, 10001n]);
      expect([...quote]).to.deep.equal(expectedShares(10001n, [5000, 3000, 2000]));
      await expect(quilt.read.quoteSplit([999n, 100n])).to.be.rejectedWith();
      await expect(quilt.read.quoteSplit([1n, 0n])).to.be.rejectedWith();
    });
  });

  describe("pay happy path", function () {
    it("pays a two-recipient split with exact balances, events and counters", async function () {
      await quilt.write.createSplit([[addr(1), addr(2)], [6000, 4000]]);
      const payer = await asSigner(wallets[9]);
      const before = [await balanceOf(addr(1)), await balanceOf(addr(2))];
      const value = 1_000_000_000_000_000_000n;
      const hash = await payer.write.pay([1n], { value });
      const after = [await balanceOf(addr(1)), await balanceOf(addr(2))];
      expect(after[0] - before[0]).to.equal(600_000_000_000_000_000n);
      expect(after[1] - before[1]).to.equal(400_000_000_000_000_000n);

      const events = await quiltEvents(hash);
      const paid = events.filter((e) => e.eventName === "SplitPaid");
      const legs = events.filter((e) => e.eventName === "RecipientPaid");
      expect(paid).to.have.lengthOf(1);
      expect(legs).to.have.lengthOf(2);

      const split = await quilt.read.getSplit([1n]);
      expect(split.totalPaid).to.equal(value);
      expect(split.paymentCount).to.equal(1n);
      expect(await balanceOf(quilt.address)).to.equal(0n);
    });

    it("pays a five-recipient split exactly", async function () {
      const recipients = [addr(1), addr(2), addr(3), addr(4), addr(5)];
      const bps = [1000, 2000, 3000, 2000, 2000];
      await quilt.write.createSplit([recipients, bps]);
      const value = 123_456_789n;
      const before = await Promise.all(recipients.map(balanceOf));
      await quilt.write.pay([1n], { value });
      const after = await Promise.all(recipients.map(balanceOf));
      const want = expectedShares(value, bps);
      after.forEach((b, i) => expect(b - before[i]).to.equal(want[i]));
      expect(await balanceOf(quilt.address)).to.equal(0n);
    });

    it("handles awkward wei with the last recipient taking the remainder", async function () {
      await quilt.write.createSplit([[addr(1), addr(2), addr(3)], [5000, 3000, 2000]]);
      const value = 10001n;
      const want = expectedShares(value, [5000, 3000, 2000]);
      expect(want).to.deep.equal([5000n, 3000n, 2001n]);
      const before = [await balanceOf(addr(1)), await balanceOf(addr(2)), await balanceOf(addr(3))];
      await quilt.write.pay([1n], { value });
      const after = [await balanceOf(addr(1)), await balanceOf(addr(2)), await balanceOf(addr(3))];
      after.forEach((b, i) => expect(b - before[i]).to.equal(want[i]));
    });

    it("accumulates totalPaid and paymentCount across successive payers", async function () {
      await quilt.write.createSplit([[addr(1), addr(2)], [5000, 5000]]);
      await (await asSigner(wallets[9])).write.pay([1n], { value: 100n });
      await (await asSigner(wallets[8])).write.pay([1n], { value: 200n });
      const split = await quilt.read.getSplit([1n]);
      expect(split.totalPaid).to.equal(300n);
      expect(split.paymentCount).to.equal(2n);
    });

    it("quote equals the actual on-chain payout deltas", async function () {
      await quilt.write.createSplit([[addr(1), addr(2), addr(3)], [3334, 3333, 3333]]);
      const value = 10_000_000_000n;
      const quote = [...(await quilt.read.quoteSplit([1n, value]))];
      const before = [await balanceOf(addr(1)), await balanceOf(addr(2)), await balanceOf(addr(3))];
      await quilt.write.pay([1n], { value });
      const after = [await balanceOf(addr(1)), await balanceOf(addr(2)), await balanceOf(addr(3))];
      after.forEach((b, i) => expect(b - before[i]).to.equal(quote[i]));
      const sum = quote.reduce((a, b) => a + b, 0n);
      expect(sum).to.equal(value);
    });
  });

  describe("pay failures leave state unchanged", function () {
    it("reverts on an unknown split", async function () {
      await expectCustomError(quilt.write.pay([42n], { value: 100n }), "SplitNotFound");
    });

    it("reverts on zero value", async function () {
      await quilt.write.createSplit([[addr(1), addr(2)], [5000, 5000]]);
      await expectCustomError(quilt.write.pay([1n], { value: 0n }), "ZeroPayment");
    });

    it("rejects dust that would pay a recipient zero wei", async function () {
      await quilt.write.createSplit([[addr(1), addr(2), addr(3)], [3334, 3333, 3333]]);
      await expectCustomError(quilt.write.pay([1n], { value: 2n }), "ZeroShare");
      const split = await quilt.read.getSplit([1n]);
      expect(split.totalPaid).to.equal(0n);
      expect(split.paymentCount).to.equal(0n);
      await expect(quilt.read.quoteSplit([1n, 2n])).to.be.rejectedWith();
    });
  });

  describe("atomicity against rejecting recipients", function () {
    it("reverts the whole payment when one recipient rejects, changing nothing", async function () {
      const rejector = await deployRejector();
      await quilt.write.createSplit([[addr(1), rejector.address], [5000, 5000]]);
      const beforeHonest = await balanceOf(addr(1));
      const value = 1_000_000_000_000_000n;
      await expectCustomError(quilt.write.pay([1n], { value }), "TransferFailed");
      expect(await balanceOf(addr(1))).to.equal(beforeHonest);
      expect(await balanceOf(rejector.address)).to.equal(0n);
      expect(await balanceOf(quilt.address)).to.equal(0n);
      const split = await quilt.read.getSplit([1n]);
      expect(split.totalPaid).to.equal(0n);
      expect(split.paymentCount).to.equal(0n);
    });
  });

  describe("reentrancy", function () {
    it("blocks a recipient that tries to re-enter pay", async function () {
      const attacker = await deployAttacker(quilt.address);
      await quilt.write.createSplit([[addr(1), attacker.address], [5000, 5000]]);
      await attacker.write.setTarget([1n]);
      const beforeHonest = await balanceOf(addr(1));
      await expect(quilt.write.pay([1n], { value: 1000000n })).to.be.rejectedWith();
      expect(await balanceOf(addr(1))).to.equal(beforeHonest);
      expect(await balanceOf(attacker.address)).to.equal(0n);
      const split = await quilt.read.getSplit([1n]);
      expect(split.totalPaid).to.equal(0n);
      expect(split.paymentCount).to.equal(0n);
    });

    it("the guard does not stick: an honest split still pays afterwards", async function () {
      const attacker = await deployAttacker(quilt.address);
      await quilt.write.createSplit([[addr(1), attacker.address], [5000, 5000]]);
      await attacker.write.setTarget([1n]);
      await expect(quilt.write.pay([1n], { value: 1000000n })).to.be.rejectedWith();
      await quilt.write.createSplit([[addr(2), addr(3)], [5000, 5000]]);
      const before = await balanceOf(addr(2));
      await quilt.write.pay([2n], { value: 1000n });
      expect(await balanceOf(addr(2))).to.equal(before + 500n);
    });
  });

  describe("deterministic property sweep", function () {
    it("sum of shares always equals the payment and quote always matches", async function () {
      const rand = mulberry32(20261110);
      for (let round = 0; round < 60; round++) {
        const n = 2 + Math.floor(rand() * 4);
        const cuts = new Set<number>();
        while (cuts.size < n - 1) cuts.add(1 + Math.floor(rand() * 9999));
        const sorted = [...cuts].sort((a, b) => a - b);
        const bps: number[] = [];
        let prev = 0;
        for (const c of sorted) {
          bps.push(c - prev);
          prev = c;
        }
        bps.push(10000 - prev);
        const recipients = Array.from({ length: n }, (_, k) => addr(1 + ((round + k) % 8)));
        const id = BigInt(round + 1);
        await quilt.write.createSplit([recipients, bps]);

        const hi = (BigInt(Math.floor(rand() * 2 ** 32)) << 32n) | BigInt(Math.floor(rand() * 2 ** 32));
        const big = (hi % 10n ** 18n) + 1n;
        for (const amount of [1n, 2n, 3n, 9999n, 10000n, 10001n, big]) {
          const want = expectedShares(amount, bps);
          if (want.some((s) => s === 0n)) {
            await expect(quilt.write.pay([id], { value: amount })).to.be.rejectedWith();
            continue;
          }
          const quote = [...(await quilt.read.quoteSplit([id, amount]))];
          expect(quote).to.deep.equal(want);
          const before = await Promise.all(recipients.map(balanceOf));
          await quilt.write.pay([id], { value: amount });
          const after = await Promise.all(recipients.map(balanceOf));
          after.forEach((b, i) => expect(b - before[i]).to.equal(want[i]));
          expect(want.reduce((a, b) => a + b, 0n)).to.equal(amount);
        }
      }
      expect(await quilt.read.nextSplitId()).to.equal(61n);
    });

    it("keeps per-split totals independent across many splits", async function () {
      await quilt.write.createSplit([[addr(1), addr(2)], [5000, 5000]]);
      await quilt.write.createSplit([[addr(1), addr(2)], [9000, 1000]]);
      await quilt.write.pay([1n], { value: 1000n });
      await quilt.write.pay([2n], { value: 1000n });
      await quilt.write.pay([2n], { value: 1000n });
      const first = await quilt.read.getSplit([1n]);
      const second = await quilt.read.getSplit([2n]);
      expect(first.totalPaid).to.equal(1000n);
      expect(first.paymentCount).to.equal(1n);
      expect(second.totalPaid).to.equal(2000n);
      expect(second.paymentCount).to.equal(2n);
    });
  });
});
