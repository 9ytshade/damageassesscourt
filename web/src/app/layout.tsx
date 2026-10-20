import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "@/lib/use-wallet";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";

export const metadata: Metadata = {
  title: "DamageAssessCourt | AI Insurance Damage Court & Proportional Indemnity",
  description:
    "Autonomous Insurance Damage Court on GenLayer. Adjudicates complex property claims using multi-validator AI consensus and continuous Basis Points indemnity math.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#000000] text-slate-100 antialiased flex flex-col font-sans selection:bg-[#ffb829]/30 selection:text-[#ffb829]">
        <WalletProvider>
          <AppHeader />
          <main className="flex-1 w-full">
            {children}
          </main>
          <AppFooter />
        </WalletProvider>
      </body>
    </html>
  );
}
