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

// Dev-only local test signer. Unset in any normal build, so nothing loads.
const devWallet = process.env.NEXT_PUBLIC_DEV_WALLET_URL;

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
