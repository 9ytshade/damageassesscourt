import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "@/lib/use-wallet";
import { AppHeader } from "@/components/app-header";

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
      <body className="min-h-screen bg-court-midnight text-slate-100 antialiased flex flex-col font-sans selection:bg-court-amber/30 selection:text-amber-200">
        <WalletProvider>
          <AppHeader />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <footer className="border-t border-slate-800/80 bg-slate-950/60 py-6 text-xs text-slate-500 text-center font-mono">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>GenLayer Studionet (Chain ID 61999)</span>
              </div>
              <div>
                DamageAssessCourt Protocol - Proportional Indemnity Consensus
              </div>
              <div className="text-slate-400">
                Continuous BPS Adjudication
              </div>
            </div>
          </footer>
        </WalletProvider>
      </body>
    </html>
  );
}
