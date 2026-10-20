"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GavelIcon, ShieldIcon, FileTextIcon, WalletIcon } from "@/components/icons";
import { useWallet } from "@/lib/use-wallet";
import { WalletConnectModal } from "./wallet-connect";
import { STUDIONET_CHAIN_ID } from "@/lib/genlayer";

export function AppHeader() {
  const pathname = usePathname();
  const { account, balance, isConnected, wrongNetwork, formatAddress } = useWallet();
  const [showWalletModal, setShowWalletModal] = useState(false);

  const navLinks = [
    { href: "/", label: "Dashboard" },
    { href: "/policies", label: "Policy Pools" },
    { href: "/protocol", label: "Protocol Spec" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <GavelIcon className="h-6 w-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-white">DamageAssessCourt</span>
                <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-500/30">
                  GenLayer
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Autonomous Insurance Damage Court</p>
            </div>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1 pl-4">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "bg-slate-800 text-amber-400"
                      : "text-slate-300 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side: Studionet Pill & Wallet button */}
        <div className="flex items-center gap-3">
          {/* Studionet Network Pill */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1 border border-slate-800 text-[11px]">
            <span
              className={`h-2 w-2 rounded-full ${
                wrongNetwork ? "bg-rose-500 animate-pulse" : "bg-emerald-500 shadow-sm shadow-emerald-500/50"
              }`}
            />
            <span className="text-slate-300 font-mono">
              {wrongNetwork ? "Wrong Network" : `Studionet (${STUDIONET_CHAIN_ID})`}
            </span>
            <a
              href="https://studio.genlayer.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 ml-1 underline"
            >
              Faucet
            </a>
          </div>

          {/* Wallet Button */}
          <button
            onClick={() => setShowWalletModal(true)}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all border ${
              isConnected
                ? wrongNetwork
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30"
                  : "bg-slate-900 text-slate-200 border-slate-700 hover:bg-slate-800"
                : "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 border-amber-400 hover:from-amber-400 hover:to-amber-500 shadow-sm shadow-amber-500/20"
            }`}
          >
            <WalletIcon className="h-4 w-4" />
            {isConnected ? (
              <span>
                {formatAddress(account)} {balance ? `(${balance} GEN)` : ""}
              </span>
            ) : (
              <span>Connect Wallet</span>
            )}
          </button>
        </div>
      </div>

      {showWalletModal && <WalletConnectModal onClose={() => setShowWalletModal(false)} />}
    </header>
  );
}
