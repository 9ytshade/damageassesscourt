"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GavelIcon } from "@/components/icons";
import { useWallet } from "@/lib/use-wallet";
import { WalletConnect } from "./wallet-connect";
import { STUDIONET_CHAIN_ID } from "@/lib/genlayer";

export function AppHeader() {
  const pathname = usePathname();
  const { wrongNetwork } = useWallet();

  const navLinks = [
    { href: "/claims", label: "Docket" },
    { href: "/policies", label: "Risk Pools" },
    { href: "/policies/create", label: "Underwrite" },
    { href: "/claims/submit", label: "File Claim" },
    { href: "/protocol", label: "Protocol" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#23252a] bg-[#000000]/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#ffb829] shadow-sm shadow-[#ffb829]/20 group-hover:scale-105 transition-transform">
              <GavelIcon className="h-5 w-5 text-black" />
            </div>
            <span className="text-base font-bold tracking-tight text-white group-hover:text-[#ffb829] transition-colors">
              DamageAssessCourt
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 pl-2">
            {navLinks.map((link) => {
              const active =
                pathname === link.href ||
                (link.href === "/claims" && pathname.startsWith("/claims") && !pathname.includes("/submit")) ||
                (link.href === "/policies" && pathname.startsWith("/policies") && !pathname.includes("/create"));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "bg-[#141518] text-[#ffb829] border border-[#23252a]"
                      : "text-[#8a8f98] hover:text-white hover:bg-[#141518]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side: Chain status and Wallet connect */}
        <div className="flex items-center gap-3">
          {/* Chain Status: Studionet over 61999 (No Faucet) */}
          <div className="hidden sm:flex flex-col items-end text-right px-3 py-1 rounded-lg border border-[#23252a] bg-[#0c0d0e]">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#d0d6e0]">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  wrongNetwork ? "bg-rose-500 animate-pulse" : "bg-emerald-400"
                }`}
              />
              <span>{wrongNetwork ? "Wrong Network" : "Studionet"}</span>
            </div>
            <span className="text-[10px] font-mono text-[#8a8f98] leading-none mt-0.5">
              {STUDIONET_CHAIN_ID}
            </span>
          </div>

          {/* Wallet Connect Popover */}
          <WalletConnect />
        </div>
      </div>
    </header>
  );
}
