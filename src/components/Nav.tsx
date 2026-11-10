import Link from "next/link";
import { WalletButton } from "./WalletButton";

export function Nav() {
  return (
    <header className="relative z-10 mx-auto flex w-full max-w-[1200px] items-center justify-between gap-4 px-5 py-6 md:px-12 md:py-7">
      <Link href="/" className="text-[28px] font-bold tracking-tight" aria-label="Quilt home">quilt.</Link>
      <nav className="flex items-center gap-4 md:gap-8" aria-label="Primary">
        <Link href="/create" className="hidden text-[15px] font-medium hover:text-violet sm:block">Create</Link>
        <Link href="/dashboard" className="hidden text-[15px] font-medium hover:text-violet sm:block">Dashboard</Link>
        <WalletButton />
      </nav>
    </header>
  );
}
