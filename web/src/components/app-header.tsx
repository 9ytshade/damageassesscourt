"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GavelIcon } from "@/components/icons";
import { useWallet } from "@/lib/use-wallet";
import { WalletConnect } from "./wallet-connect";
import { STUDIONET_CHAIN_ID } from "@/lib/genlayer";

export function AppHeader() {
  const pathname = usePathname();
  const { wrongNetwork } = useWallet();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/claims", label: "Docket" },
    { href: "/policies", label: "Risk Pools" },
    { href: "/policies/create", label: "Underwrite" },
    { href: "/claims/submit", label: "File Claim" },
    { href: "/protocol", label: "Protocol" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#22242c] bg-[#000000]/90 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-[1536px] items-center justify-between px-5 sm:px-8 lg:px-12">
        {/* Brand & Logo on Left */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#18191e] border border-[#2e303a] shadow-sm group-hover:scale-105 transition-transform">
              <GavelIcon className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white group-hover:text-[#d8dbe4] transition-colors">
              DamageAssessCourt
            </span>
          </Link>
        </div>

        {/* Navigation Links Centered */}
        <nav className="hidden md:flex flex-1 items-center justify-center gap-2 px-6">
          {navLinks.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname === link.href ||
                  (link.href === "/claims" && pathname.startsWith("/claims") && !pathname.includes("/submit")) ||
                  (link.href === "/policies" && pathname.startsWith("/policies") && !pathname.includes("/create"));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  active
                    ? "bg-[#18191e] text-white border border-[#2e313c] shadow-sm font-semibold"
                    : "text-[#9ea3b2] hover:text-white hover:bg-[#141519]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side: Chain status, Wallet connect & Mobile menu toggle */}
        <div className="flex items-center gap-3">
          {/* Chain Status: Studionet over 61999 */}
          <div className="hidden sm:flex flex-col items-end text-right px-3.5 py-1.5 rounded-xl border border-[#242630] bg-[#101115]">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#d8dbe4]">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  wrongNetwork ? "bg-rose-500 animate-pulse" : "bg-emerald-400"
                }`}
              />
              <span>{wrongNetwork ? "Wrong Network" : "Studionet"}</span>
            </div>
            <span className="text-[11px] font-mono text-[#8a8f9c] leading-none mt-0.5">
              {STUDIONET_CHAIN_ID}
            </span>
          </div>

          {/* Wallet Connect Button / Popover */}
          <div className="hidden sm:block">
            <WalletConnect />
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-[#282a33] bg-[#121317] text-[#c4c7d4] hover:text-white hover:bg-[#1a1c22] transition-colors"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <span className="text-xl font-bold leading-none">&times;</span>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Slide-Down Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#22242c] bg-[#0c0d10] px-5 py-6 space-y-4 animate-fade-in">
          <nav className="flex flex-col space-y-2">
            {navLinks.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname === link.href ||
                    (link.href === "/claims" && pathname.startsWith("/claims") && !pathname.includes("/submit")) ||
                    (link.href === "/policies" && pathname.startsWith("/policies") && !pathname.includes("/create"));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    active
                      ? "bg-[#18191e] text-white border border-[#2e313c] font-semibold"
                      : "text-[#9ea3b2] hover:text-white hover:bg-[#141519]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-[#22242c] flex flex-col gap-3">
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#141519] border border-[#242630] text-xs font-mono">
              <span className="text-[#8a8f9c]">Chain Network:</span>
              <span className="text-white font-semibold">Studionet ({STUDIONET_CHAIN_ID})</span>
            </div>
            <WalletConnect />
          </div>
        </div>
      )}
    </header>
  );
}
