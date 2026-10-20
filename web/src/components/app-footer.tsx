"use client";

import React from "react";
import Link from "next/link";
import { DAMAGE_ASSESS_COURT_ADDRESS, STUDIONET_CHAIN_ID } from "@/lib/genlayer";

export function AppFooter() {
  const shortContract = `${DAMAGE_ASSESS_COURT_ADDRESS.slice(0, 6)}...${DAMAGE_ASSESS_COURT_ADDRESS.slice(-4)}`;

  return (
    <footer className="mt-auto border-t border-[#22242c] bg-[#000000] py-8 text-sm text-[#8a8f9c]">
      <div className="mx-auto max-w-[1536px] w-full px-5 sm:px-8 lg:px-12 space-y-6">
        {/* Main Tri-Section Bar matching Reference Design */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-2 border-b border-[#1c1d23] text-xs font-mono">
          {/* Left: Brand & Network */}
          <div className="flex items-center gap-2 text-[#d8dbe4]">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
            <span className="font-semibold text-white">DamageAssessCourt</span>
            <span className="text-[#8a8f9c]">v1.0.0</span>
            <span className="text-[#333640]">/</span>
            <span className="text-[#8a8f9c]">GenLayer Studionet ({STUDIONET_CHAIN_ID})</span>
          </div>

          {/* Center: Protocol Engine (Hidden on mobile to keep footer compact) */}
          <div className="hidden md:block text-[#8a8f9c] text-center tracking-wider">
            Autonomous Magistrate Jury &middot; Continuous Basis Points Settlement
          </div>

          {/* Right: Copyright & Author */}
          <div className="text-xs tracking-wider text-[#8a8f9c]">
            &copy; 2026 DAMAGEASSESSCOURT &middot; BUILT BY{" "}
            <a
              href="https://github.com/9ytshade"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white font-bold underline underline-offset-4 hover:text-[#c2c6d2] transition-colors"
            >
              9YTSHADE
            </a>
          </div>
        </div>

        {/* Secondary Navigation & Contract Verification Links */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#8a8f9c]">
          {/* Disclaimer text (Hidden on small screens to reduce mobile footer height) */}
          <p className="hidden sm:block max-w-xl text-xs leading-relaxed text-[#686c7b]">
            Intelligent Insurance Adjudication on GenLayer. Non-deterministic physical evidence evaluated
            by multi-validator AI consensus. Testnet tokens hold no fiat redemption value.
          </p>

          {/* Clean Links */}
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-6 gap-y-2 text-xs">
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
              className="hover:text-white transition-colors inline-flex items-center gap-1"
            >
              Contract: {shortContract} &rarr;
            </a>
            <a
              href="https://github.com/9ytshade"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              GitHub &rarr;
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
