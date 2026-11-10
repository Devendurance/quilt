import type { Metadata } from "next";
import { Georama } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

const georama = Georama({ variable: "--font-georama", subsets: ["latin"], weight: ["500"] });

export const metadata: Metadata = {
  title: "Quilt | Split one payment, settle everyone",
  description: "Immutable native BOT split payments on BOT Chain. One transaction pays every recipient their exact share.",
};

// Dev-only local test signer. The NODE_ENV check is inlined at build time, so a
// production build drops this branch even if the env var is set by mistake.
// The URL must also be a loopback address.
const devWalletRaw = process.env.NODE_ENV === "development" ? process.env.NEXT_PUBLIC_DEV_WALLET_URL : undefined;
const devWallet = devWalletRaw && /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(devWalletRaw) ? devWalletRaw : undefined;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={georama.variable}>
      <head>
        <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,700,900&display=swap" />
        {devWallet ? <Script src={`${devWallet}/provider.js`} strategy="beforeInteractive" /> : null}
      </head>
      <body className="min-h-screen flex flex-col">
        <Providers>
          <Nav />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
