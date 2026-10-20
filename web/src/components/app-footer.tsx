"use client";

import React from "react";
import Link from "next/link";
import { DAMAGE_ASSESS_COURT_ADDRESS, STUDIONET_CHAIN_ID } from "@/lib/genlayer";

export function AppFooter() {
  const shortContract = `${DAMAGE_ASSESS_COURT_ADDRESS.slice(0, 6)}...${DAMAGE_ASSESS_COURT_ADDRESS.slice(-4)}`;

  return (
    <footer className="mt-auto border-t border-[#23252a] bg-[#000000] py-8 text-xs text-[#8a8f98]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Main Tri-Section Bar matching Reference Design */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-2 border-b border-[#171821] text-[11px] font-mono">
          {/* Left */}
          <div className="flex items-center gap-2 text-[#d0d6e0]">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
            <span className="font-semibold text-white">DamageAssessCourt</span>
            <span className="text-[#8a8f98]">v1.0.0</span>
            <span className="text-[#383b3f]">/</span>
            <span className="text-[#8a8f98]">GenLayer Studionet ({STUDIONET_CHAIN_ID})</span>
          </div>

          {/* Center */}
          <div className="text-[#8a8f98] text-center tracking-wider">
            Autonomous Magistrate Jury &middot; Basis Points Settlement
          </div>

          {/* Right */}
          <div className="text-[11px] tracking-wider text-[#8a8f98]">
            &copy; 2026 DAMAGEASSESSCOURT &middot; BUILT BY{" "}
            <a
              href="https://github.com/9ytshade"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#ffb829] underline underline-offset-4 font-bold hover:text-[#e5a420] transition-colors"
            >
              9YTSHADE
            </a>
          </div>
        </div>

        {/* Secondary Navigation & Contract Verification Links */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-[#8a8f98]">
          <p className="max-w-xl text-[11px] leading-relaxed text-[#62666d]">
            Intelligent Insurance Adjudication on GenLayer. Non-deterministic physical evidence evaluated
            by multi-validator AI consensus. Testnet tokens hold no fiat redemption value.
          </p>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="/protocol" className="hover:text-white transition-colors">
              Protocol Spec
            </Link>
            <a
              href={`https://studio.genlayer.com/address/${DAMAGE_ASSESS_COURT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#ffb829] transition-colors inline-flex items-center gap-1"
            >
              Contract: {shortContract} ↗
            </a>
            <a
              href="https://github.com/9ytshade"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              GitHub ↗
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
