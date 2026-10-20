"use client";

import React, { useState } from "react";
import Link from "next/link";
import { calculateBpsSettlement } from "@/lib/safety";
import { DAMAGE_ASSESS_COURT_ADDRESS, STUDIONET_CHAIN_ID } from "@/lib/genlayer";

const sections = [
  ["model", "The model"],
  ["lifecycle", "Claim lifecycle"],
  ["bps-engine", "Basis points engine"],
  ["consensus", "Equivalence principle & jury"],
  ["protections", "Contract protections"],
  ["scope", "System scope"],
  ["network", "Network & risk"],
] as const;

export default function ProtocolPage() {
  const [calcClaimed, setCalcClaimed] = useState<string>("50000");
  const [calcBps, setCalcBps] = useState<number>(6850);
  const [calcStake, setCalcStake] = useState<string>("1000");

  const calcResult = calculateBpsSettlement(
    calcClaimed || "0",
    calcBps,
    calcStake || "0",
    calcStake || "0"
  );

  return (
    <main className="min-h-screen bg-[#000000] text-slate-100">
      <div className="relative mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        {/* Guide Header */}
        <header className="grid gap-10 border-b border-[#23252a] py-14 md:grid-cols-12 md:py-20">
          <div className="md:col-span-8">
            <p className="font-mono mb-4 text-[11px] uppercase tracking-widest text-[#ffb829]">
              DAMAGEASSESSCOURT / PROTOCOL SPECIFICATION
            </p>
            <h1 className="text-4xl sm:text-6xl font-black leading-[1.02] tracking-tight text-white">
              A decentralized path from physical damage to verified indemnity.
            </h1>
            <p className="mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-[#8a8f98]">
              The rules behind DamageAssessCourt&apos;s autonomous property insurance: how escrow is pooled,
              what evidence claimants submit, how GenLayer validators cross-examine ambiguous terms, and how
              continuous basis-point settlements execute on-chain.
            </p>
          </div>
          <aside className="self-end border-l border-[#23252a] pl-6 md:col-span-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#8a8f98]">
              THE SHORT VERSION
            </p>
            <p className="mt-3 text-xl font-medium leading-snug text-[#d0d6e0]">
              A funded risk pool. Multi-source evidence. AI magistrate jury consensus. Continuous basis-points settlement.
            </p>
          </aside>
        </header>

        {/* 12-Column Guide Layout */}
        <div className="grid gap-12 py-12 md:grid-cols-12 md:gap-16">
          {/* Sticky In-Guide Sidebar */}
          <aside className="md:col-span-3">
            <div className="sticky top-24 space-y-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#8a8f98]">
                IN THIS GUIDE
              </p>
              <nav aria-label="Protocol sections" className="flex flex-col items-start gap-2.5 border-l border-[#23252a] pl-4 text-xs font-mono text-[#8a8f98]">
                {sections.map(([id, label]) => (
                  <a
                    key={id}
                    className="hover:text-[#ffb829] transition-colors"
                    href={`#${id}`}
                  >
                    {label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Protocol Content */}
          <div className="space-y-20 md:col-span-9 text-left">
            {/* 01: The Model */}
            <section id="model" className="scroll-mt-24 space-y-6">
              <SectionHeading number="01" title="The model" />
              <p className="max-w-3xl text-base leading-relaxed text-[#8a8f98]">
                DamageAssessCourt is an autonomous property damage court and indemnity protocol. Underwriters lock capital into an escrow pool backed by explicit policy terms. Claimants file structured damage reports containing photo URLs, Doppler radar records, and dispatch numbers. GenLayer validators act as an impartial magistrate jury, parsing untrusted evidence against legal clauses to formulate continuous graduated payouts.
              </p>
              <div className="grid gap-px overflow-hidden rounded-xl border border-[#23252a] bg-[#23252a] sm:grid-cols-3">
                <ProtocolCard
                  index="A"
                  title="Underwriter"
                  text="Deploys risk pool, defines perils and verbatim exclusion clauses, and funds initial escrow capital."
                />
                <ProtocolCard
                  index="B"
                  title="Claimant"
                  text="Submits photographic evidence, weather records, incident timestamps, and posts an anti-spam stake."
                />
                <ProtocolCard
                  index="C"
                  title="Magistrate Jury"
                  text="GenLayer AI validators evaluate photos and texts under the Equivalence Principle to determine basis points."
                />
              </div>
            </section>

            {/* 02: Claim Lifecycle */}
            <section id="lifecycle" className="scroll-mt-24 space-y-6">
              <SectionHeading number="02" title="Claim lifecycle" />
              <ol className="divide-y divide-[#23252a] border-y border-[#23252a]">
                <LifecycleStep
                  number="01"
                  title="Underwrite and fund pool"
                  text="Underwriter locks initial GEN into the intelligent contract escrow, establishing the max claim cap, deductible BPS, and verbatim exclusion clauses."
                />
                <LifecycleStep
                  number="02"
                  title="File damage claim with proof"
                  text="Claimant submits a damage narrative, claimed indemnity amount, and evidence links (damage photos, Doppler weather radar, dispatch reports) while locking a required anti-spam stake."
                />
                <LifecycleStep
                  number="03"
                  title="AI magistrate adjudication"
                  text="Eligible caller triggers intelligent contract adjudication. Validators fetch documents, inspect physical images, verify weather coordinates, and output a consensus Basis Points rating (0 to 10,000 bps)."
                />
                <LifecycleStep
                  number="04"
                  title="Contest window and defense"
                  text="Before final payout, an interested party may post a dispute bond to challenge the preliminary verdict. The claimant may file a formal defense rebuttal with additional proof."
                />
                <LifecycleStep
                  number="05"
                  title="Final settlement or slashing"
                  text="Upon consensus resolution, approved payouts are disbursed immediately to the claimant with their stake refunded. If deemed fraudulent, the claimant stake is slashed to the pool."
                />
              </ol>

              <div className="grid gap-4 sm:grid-cols-2 pt-2">
                <div className="rounded-xl border border-[#23252a] bg-[#0c0d0e] p-5">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-[#ffb829]">
                    FRAUD SLASHING GUARD
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-[#8a8f98]">
                    Filings presenting fabricated images, pre-existing rust as acute storm breach, or forged dispatch reports trigger a fraud verdict. The claimant stake is permanently slashed and absorbed into the pool.
                  </p>
                </div>

                <div className="rounded-xl border border-[#23252a] bg-[#0c0d0e] p-5">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-emerald-400">
                    EXCESS CAPITAL PRESERVATION
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-[#8a8f98]">
                    When claims settle for partial loss (e.g. 6,850 basis points), the unspent portion of the maximum cap remains fully preserved in the escrow pool to support future valid claims.
                  </p>
                </div>
              </div>
            </section>

            {/* 03: Basis Points Engine */}
            <section id="bps-engine" className="scroll-mt-24 space-y-6">
              <SectionHeading number="03" title="Basis points engine" />
              <div className="grid gap-6 md:grid-cols-12">
                <p className="text-base leading-relaxed text-[#8a8f98] md:col-span-7">
                  Traditional parametric insurance relies on crude binary switches: either pay 100% or pay 0%. DamageAssessCourt implements continuous proportional indemnity math: validators calibrate damage severity across 10,000 Basis Points (0.01% increments). This accounts for real-world nuances like pre-existing wear, partially salvable inventory, and proportionate deductible deductions.
                </p>
                <aside className="border-l-2 border-[#ffb829] pl-5 md:col-span-5">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-[#ffb829]">
                    CONTINUOUS INDEMNITY FORMULA
                  </p>
                  <p className="mt-2 font-mono text-xs text-[#d0d6e0] leading-relaxed">
                    Payout = min(Claimed, Cap) * max(0, BPS - DeductibleBPS) / 10000
                  </p>
                </aside>
              </div>

              {/* Interactive BPS Simulator */}
              <div className="rounded-2xl border border-[#23252a] bg-[#0c0d0e] p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#23252a] pb-4">
                  <div>
                    <h3 className="text-base font-bold text-white font-mono">
                      Interactive Basis Points Math Simulator
                    </h3>
                    <p className="text-xs text-[#8a8f98]">
                      Test exact integer arithmetic and value conservation across the 10,000 BPS spectrum.
                    </p>
                  </div>
                  <span className="font-mono text-xs px-2.5 py-1 rounded bg-[#ffb829]/10 text-[#ffb829] border border-[#ffb829]/30">
                    0.01% Resolution
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                  <div>
                    <label className="block text-[#8a8f98] uppercase text-[10px] mb-1">
                      Claimed Amount (GEN)
                    </label>
                    <input
                      type="number"
                      value={calcClaimed}
                      onChange={(e) => setCalcClaimed(e.target.value)}
                      className="w-full rounded-xl border border-[#23252a] bg-[#141518] px-3 py-2 text-white font-mono focus:border-[#ffb829] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[#8a8f98] uppercase text-[10px] mb-1">
                      Settlement BPS: {calcBps} ({(calcBps / 100).toFixed(2)}%)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10000"
                      step="50"
                      value={calcBps}
                      onChange={(e) => setCalcBps(Number(e.target.value))}
                      className="w-full accent-[#ffb829] cursor-pointer mt-2"
                    />
                  </div>

                  <div>
                    <label className="block text-[#8a8f98] uppercase text-[10px] mb-1">
                      Claimant Anti-Spam Stake (GEN)
                    </label>
                    <input
                      type="number"
                      value={calcStake}
                      onChange={(e) => setCalcStake(e.target.value)}
                      className="w-full rounded-xl border border-[#23252a] bg-[#141518] px-3 py-2 text-white font-mono focus:border-[#ffb829] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#23252a] font-mono text-xs">
                  <div className="rounded-xl bg-[#141518] p-3 border border-[#23252a]">
                    <span className="text-[10px] text-[#8a8f98] uppercase block">Gross Indemnity</span>
                    <span className="text-sm font-bold text-[#ffb829] mt-1 block">
                      {calcResult.grossPayout} GEN
                    </span>
                  </div>

                  <div className="rounded-xl bg-[#141518] p-3 border border-[#23252a]">
                    <span className="text-[10px] text-[#8a8f98] uppercase block">Deductible Offset</span>
                    <span className="text-sm font-bold text-[#8a8f98] mt-1 block">
                      500 bps (5%)
                    </span>
                  </div>

                  <div className="rounded-xl bg-[#141518] p-3 border border-[#23252a]">
                    <span className="text-[10px] text-[#8a8f98] uppercase block">Stake Disposition</span>
                    <span className={`text-sm font-bold mt-1 block ${calcResult.claimantRefundedStake !== "0" ? "text-emerald-400" : "text-rose-400"}`}>
                      {calcResult.claimantRefundedStake !== "0" ? "Refunded" : "Slashed"}
                    </span>
                  </div>

                  <div className="rounded-xl bg-[#141518] p-3 border border-[#23252a]">
                    <span className="text-[10px] text-[#8a8f98] uppercase block">Net Claimant Transfer</span>
                    <span className="text-sm font-bold text-white mt-1 block">
                      {calcResult.netClaimantReceived} GEN
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* 04: Equivalence Principle & Jury */}
            <section id="consensus" className="scroll-mt-24 space-y-6">
              <SectionHeading number="04" title="Equivalence principle & jury" />
              <div className="grid gap-8 md:grid-cols-12">
                <p className="text-base leading-relaxed text-[#8a8f98] md:col-span-7">
                  GenLayer Intelligent Contracts evaluate non-deterministic tasks without relying on trusted central oracles. When adjudicating a claim, multiple independent validator nodes retrieve external media and feed structured prompts to LLMs. Consensus is reached using the Equivalence Principle: as long as validator judgments agree within bounded tolerance, the on-chain state transition finalizes.
                </p>
                <aside className="border-l-2 border-[#8052ff] pl-5 md:col-span-5">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-[#8052ff]">
                    UNTRUSTED INPUT RULE
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-[#8a8f98]">
                    Submitted URLs and documents are treated strictly as evidence, never as execution instructions. Prompt injection attempts within submitted narratives are discarded by validator sandboxes.
                  </p>
                </aside>
              </div>
              <p className="text-sm leading-relaxed text-[#8a8f98]">
                If external media returns deterministic errors (such as HTTP 404 or 410), validators treat the missing item as unproven. If external infrastructure experiences transient errors (such as HTTP 429 rate limits or 503 gateway outages), the verdict records UNDETERMINED, preserving all escrow capital and allowing adjudication to be re-run safely.
              </p>
            </section>

            {/* 05: Contract Protections */}
            <section id="protections" className="scroll-mt-24 space-y-6">
              <SectionHeading number="05" title="Contract protections" />
              <ul className="grid gap-x-8 gap-y-3 border-t border-[#23252a] pt-6 sm:grid-cols-2 text-xs font-mono text-[#8a8f98]">
                <Protection text="All policy escrow is pre-funded at creation and locked on-chain." />
                <Protection text="A claim can be paid at most once; double-settlement is prevented." />
                <Protection text="Payouts can never exceed the policy's max claim cap or available pool balance." />
                <Protection text="Anti-spam stakes disincentivize frivolous or synthetic loss filings." />
                <Protection text="Contest window allows underwriters or policyholders to post dispute bonds." />
                <Protection text="Rejection or partial payout leaves remaining pool capital unencumbered." />
                <Protection text="Settlement execution is tied to validator consensus finality, not single wallet calls." />
                <Protection text="Every filing, evidence link, defense brief, and verdict remains permanently inspectable." />
              </ul>
            </section>

            {/* 06: System Scope */}
            <section id="scope" className="scroll-mt-24 space-y-6">
              <SectionHeading number="06" title="System scope" />
              <div className="grid gap-px overflow-hidden rounded-xl border border-[#23252a] bg-[#23252a] sm:grid-cols-2">
                <div className="bg-[#0c0d0e] p-6 space-y-3">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-[#ffb829]">
                    SUPPORTED IN CURRENT PROTOCOL
                  </p>
                  <ul className="space-y-2 text-xs leading-relaxed text-[#8a8f98]">
                    <li>&bull; Commercial & residential property structural damage.</li>
                    <li>&bull; Multi-peril definitions: Windstorm, Hail, Pipe burst, Flash flood.</li>
                    <li>&bull; Photographic evidence URLs with coordinate metadata.</li>
                    <li>&bull; External NOAA weather radar and police dispatch incident links.</li>
                    <li>&bull; Continuous 0 to 10,000 basis points indemnity settlement.</li>
                  </ul>
                </div>

                <div className="bg-[#0c0d0e] p-6 space-y-3">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-[#8a8f98]">
                    FUTURE PROTOCOL EXTENSIONS
                  </p>
                  <ul className="space-y-2 text-xs leading-relaxed text-[#8a8f98]">
                    <li>&bull; Automated drone photogrammetry and LIDAR point-cloud parsing.</li>
                    <li>&bull; Fiat stablecoin (USDC) native liquidity pools.</li>
                    <li>&bull; Reinsurance catastrophe bond tranche syndication.</li>
                    <li>&bull; Zero-knowledge private evidence proofs for sensitive commercial sites.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 07: Network & Risk */}
            <section id="network" className="scroll-mt-24 space-y-6">
              <SectionHeading number="07" title="Network & risk" />
              <div className="rounded-2xl border border-[#23252a] bg-[#0c0d0e] p-6 sm:p-8 space-y-4">
                <p className="text-lg font-bold text-white">
                  DamageAssessCourt operates on GenLayer Studionet (Chain ID {STUDIONET_CHAIN_ID}).
                </p>
                <p className="text-xs sm:text-sm leading-relaxed text-[#8a8f98]">
                  This implementation is a functional decentralized intelligent contract demonstration running on GenLayer Studionet. Tokens held or transacted are testnet GEN and carry no monetary value. Gas fees and validator incentives are simulated by the network.
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono">
                  <a
                    className="text-[#ffb829] underline underline-offset-4 hover:text-[#e5a420] transition-colors"
                    href={`https://studio.genlayer.com/address/${DAMAGE_ASSESS_COURT_ADDRESS}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    INSPECT CONTRACT ON EXPLORER ↗
                  </a>
                  <span className="text-[#383b3f]">&middot;</span>
                  <a
                    className="text-[#8a8f98] underline underline-offset-4 hover:text-white transition-colors"
                    href="https://github.com/9ytshade/damageassesscourt"
                    target="_blank"
                    rel="noreferrer"
                  >
                    CONTRACT SOURCE & TEST SUITE ↗
                  </a>
                </div>
              </div>
            </section>

            {/* Bottom Navigation */}
            <div className="border-t border-[#23252a] pt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-xl font-bold text-white">Proof of damage first. Settlement next.</p>
                <p className="text-xs text-[#8a8f98] mt-1 font-mono">
                  Explore active claims or deploy your own underwriting facility.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/claims"
                  className="btn-pill-gold font-mono text-xs"
                >
                  Explore Docket &rarr;
                </Link>
                <Link
                  href="/policies"
                  className="btn-ghost font-mono text-xs"
                >
                  Risk Pools
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function SectionHeading({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-[#23252a] pb-3">
      <span className="font-mono text-xs font-bold text-[#ffb829] bg-[#ffb829]/10 px-2 py-0.5 rounded border border-[#ffb829]/30">
        {number}
      </span>
      <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white capitalize">
        {title}
      </h2>
    </div>
  );
}

function ProtocolCard({ index, title, text }: { index: string; title: string; text: string }) {
  return (
    <article className="bg-[#0c0d0e] p-6 space-y-2 text-left">
      <p className="font-mono text-xs text-[#ffb829] font-bold">{index}</p>
      <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
      <p className="text-xs leading-relaxed text-[#8a8f98]">{text}</p>
    </article>
  );
}

function LifecycleStep({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <li className="grid gap-2 py-5 sm:grid-cols-[40px_200px_1fr] sm:gap-4 items-start text-left">
      <span className="font-mono text-xs font-bold text-[#ffb829]">{number}</span>
      <h3 className="text-sm font-bold text-white font-mono">{title}</h3>
      <p className="text-xs leading-relaxed text-[#8a8f98]">{text}</p>
    </li>
  );
}

function Protection({ text }: { text: string }) {
  return (
    <li className="flex gap-2.5 items-start">
      <span className="text-[#ffb829] font-bold" aria-hidden="true">
        +
      </span>
      <span className="leading-relaxed">{text}</span>
    </li>
  );
}
