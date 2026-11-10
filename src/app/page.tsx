import Link from "next/link";
import { Layers, Link2, ShieldCheck, Zap } from "lucide-react";
import { HeroCapsule } from "@/components/HeroCapsule";
import { LiveCount } from "@/components/LiveCount";

function Sphere({ className, style }: { className: string; style: React.CSSProperties }) {
  return (
    <span
      aria-hidden
      className={`absolute rounded-full ${className}`}
      style={{ ...style, boxShadow: "inset -6px -8px 14px rgba(11,11,12,.08), inset 6px 6px 12px rgba(255,255,255,.9)" }}
    />
  );
}

function HeroObject() {
  return (
    <div aria-hidden className="pointer-events-none absolute right-[-6%] top-[-40px] hidden h-[640px] w-[560px] md:block lg:right-[2%]">
      <div className="float-a absolute left-[90px] top-[60px] h-[470px] w-[300px]" style={{ transform: "rotateX(-12deg) rotateZ(18deg)", transformOrigin: "50% 100%" }}>
        <div className="h-full w-full rounded-[32px]" style={{ background: "rgba(255,255,255,.55)", border: "1.5px solid rgba(255,255,255,.9)", backdropFilter: "blur(20px)", boxShadow: "0 30px 60px rgba(94,63,214,.12)" }} />
        <div className="absolute left-8 right-8 top-10 space-y-3">
          <div className="h-3 w-24 rounded-full bg-[#7B5CF0]/30" />
          <div className="h-3 w-40 rounded-full bg-black/10" />
          <div className="h-3 w-32 rounded-full bg-black/10" />
        </div>
      </div>
      <div className="absolute bottom-[40px] left-[20px] h-[150px] w-[420px] rounded-[28px]" style={{ background: "linear-gradient(180deg,#c9cdd4,#9aa0aa)", transform: "perspective(600px) rotateX(58deg)", opacity: 0.85 }} />
      <Sphere className="float-b" style={{ width: 70, height: 70, left: 10, top: 90, background: "radial-gradient(circle at 30% 30%, #fff, #d9ccf5)" }} />
      <Sphere className="float-c" style={{ width: 26, height: 26, left: 330, top: 120, background: "radial-gradient(circle at 30% 30%, #fff, #f4c9d6)" }} />
      <Sphere className="float-a" style={{ width: 54, height: 54, left: 430, top: 420, background: "radial-gradient(circle at 30% 30%, #fff, #c9d3dc)" }} />
      <Sphere className="float-b" style={{ width: 38, height: 38, left: 60, top: 420, background: "radial-gradient(circle at 30% 30%, #fff, #f4c9d6)" }} />
    </div>
  );
}

const features = [
  { icon: Layers, title: "One payment, every share", body: "Pick 2 to 5 recipients and their percentages. A payer sends once and each person receives their exact share in the same transaction." },
  { icon: ShieldCheck, title: "Fixed once, forever", body: "Splits can't be edited, paused or redirected. No admin, no fees, no custody. The contract only moves funds the instant they arrive." },
];

export default function Home() {
  return (
    <>
      <section className="relative isolate overflow-hidden">
        <div className="bloom" aria-hidden />
        <div className="relative mx-auto max-w-[1200px] px-5 pb-24 pt-10 md:px-12 md:pt-20">
          <HeroObject />
          <h1 className="display rise relative max-w-[760px]">
            <b>Split</b> one payment
            <br />
            <span>between </span><b>everyone.</b>
          </h1>
          <p className="rise relative mt-8 max-w-[520px] text-slate" style={{ animationDelay: "80ms" }}>
            Quilt turns a joint payout into one link. Share it, get paid in native BOT, and every recipient receives their agreed share on-chain in a single transaction.
          </p>
          <div className="rise relative mt-12" style={{ animationDelay: "160ms" }}>
            <HeroCapsule />
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href="/create" className="btn btn-primary">Create a split</Link>
              <Link href="/dashboard" className="btn btn-ghost">Your dashboard</Link>
            </div>
            <p className="label mt-5 text-stone">Live on BOT Chain testnet (Bohr). Test BOT only.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1120px] px-5 md:px-12" aria-label="Why Quilt">
        <div className="glass grid gap-10 px-6 py-12 md:grid-cols-2 md:gap-16 md:px-12 md:py-14">
          {features.map((f) => (
            <div key={f.title}>
              <div className="icon-tile"><f.icon size={24} strokeWidth={2} /></div>
              <h2 className="h3 mt-6">{f.title}</h2>
              <p className="mt-3 text-slate">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-[120px] max-w-[1200px] px-5 md:px-12" aria-labelledby="how">
        <h2 id="how" className="h2 max-w-[640px]"><b>Three steps,</b> <span className="font-light">no accounts.</span></h2>
        <div className="mt-12 grid gap-5 md:grid-cols-12">
          <div className="tile bg-white md:col-span-4 md:min-h-[340px]">
            <span className="label inline-block" style={{ transform: "rotate(-4deg)" }}>STEP 1</span>
            <div className="mt-10"><Link2 className="text-violet" /></div>
            <h3 className="h3 mt-4">Create</h3>
            <p className="mt-2 text-slate">Add recipients and percentages, confirm once.</p>
          </div>
          <div className="tile bg-[#d9ccf5] md:col-span-4 md:min-h-[340px]">
            <span className="label inline-block" style={{ transform: "rotate(-4deg)" }}>STEP 2</span>
            <h3 className="h3 mt-[70px]">Share</h3>
            <p className="mt-2 text-slate">Send the public split link. Recipients are read from the chain, not from us.</p>
          </div>
          <div className="tile bg-violet text-white md:col-span-4 md:min-h-[340px]">
            <span className="label inline-block" style={{ transform: "rotate(-4deg)" }}>STEP 3</span>
            <div className="mt-10"><Zap /></div>
            <h3 className="h3 mt-4">Get paid</h3>
            <p className="mt-2 text-white/85">One transaction. Exact amounts previewed from the contract before anyone signs.</p>
          </div>
          <div className="tile bg-[#c9d3dc] md:col-span-6 md:min-h-[200px]">
            <span className="label inline-block" style={{ transform: "rotate(-4deg)" }}>ON-CHAIN NOW</span>
            <p className="numeral mt-4 text-[40px] leading-[44px]"><LiveCount /></p>
            <p className="mt-1 text-slate">splits created on Bohr testnet</p>
          </div>
          <div className="tile bg-[#f7dccb] md:col-span-6 md:min-h-[200px]">
            <span className="label inline-block" style={{ transform: "rotate(-4deg)" }}>FEES</span>
            <p className="numeral mt-4 text-[40px] leading-[44px]">0%</p>
            <p className="mt-1 text-slate">Quilt takes nothing. You only pay network gas.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-[120px] max-w-[1200px] px-5 text-center md:px-12">
        <h2 className="h2"><b>Ready</b> <span className="font-light">to split?</span></h2>
        <p className="mx-auto mt-4 max-w-[460px] text-slate">Connect a wallet on Bohr testnet and create your first split in under a minute.</p>
        <div className="mt-8 flex justify-center"><Link href="/create" className="btn btn-primary">Create a split</Link></div>
      </section>
    </>
  );
}
