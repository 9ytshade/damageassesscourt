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
    <div className="w-full pb-20 space-y-12 animate-fade-in bg-[#000000] text-slate-100">
      {/* Full-Width Guide Header matching Landing Page */}
      <section className="relative w-full border-b border-[#22242c] bg-[#000000] py-14 lg:py-20">
        <div className="mx-auto max-w-[1536px] w-full px-5 sm:px-8 lg:px-12">
          <div className="grid gap-10 md:grid-cols-12 md:items-end">
            <div className="md:col-span-8 space-y-4">
              <p className="font-mono text-xs uppercase tracking-widest text-[#8a8f9c]">
                DAMAGEASSESSCOURT / PROTOCOL SPECIFICATION
              </p>
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black leading-[1.02] tracking-tight text-white">
                A decentralized path from physical damage to verified indemnity.
              </h1>
              <p className="text-base sm:text-xl leading-relaxed text-[#9ea3b2]">
                The rules behind DamageAssessCourt&apos;s autonomous property insurance: how escrow is pooled,
                what evidence claimants submit, how GenLayer validators cross-examine ambiguous terms, and how
                continuous basis-point settlements execute on-chain.
              </p>
            </div>
            <aside className="self-end border-l border-[#22242c] pl-6 md:col-span-4 space-y-2">
              <p className="font-mono text-xs uppercase tracking-widest text-[#8a8f9c]">
                THE SHORT VERSION
              </p>
              <p className="text-xl font-medium leading-snug text-[#d8dbe4]">
                A funded risk pool. Multi-source evidence. AI magistrate jury consensus. Continuous basis-points settlement.
              </p>
            </aside>
          </div>
        </div>
      </section>

      {/* 12-Column Guide Layout */}
      <div className="mx-auto max-w-[1536px] w-full px-5 sm:px-8 lg:px-12">
        <div className="grid gap-12 md:grid-cols-12 md:gap-16">
          {/* Sticky In-Guide Sidebar */}
          <aside className="md:col-span-3">
            <div className="sticky top-28 space-y-4">
              <p className="font-mono text-xs uppercase tracking-widest text-[#8a8f9c]">
                IN THIS GUIDE
              </p>
              <nav aria-label="Protocol sections" className="flex flex-col items-start gap-3 border-l border-[#22242c] pl-4 text-sm font-mono text-[#8a8f9c]">
                {sections.map(([id, label]) => (
                  <a
                    key={id}
                    className="hover:text-white transition-colors"
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
            <section id="model" className="scroll-mt-28 space-y-6">
              <SectionHeading number="01" title="The model" />
              <p className="text-base sm:text-lg leading-relaxed text-[#9ea3b2]">
                DamageAssessCourt is an autonomous property damage court and indemnity protocol. Underwriters lock capital into an escrow pool backed by explicit policy terms. Claimants file structured damage reports containing photo URLs, Doppler radar records, and dispatch numbers. GenLayer validators act as an impartial magistrate jury, parsing untrusted evidence against legal clauses to formulate continuous graduated payouts.
              </p>
              <div className="grid gap-px overflow-hidden rounded-2xl border border-[#22242c] bg-[#22242c] sm:grid-cols-3">
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
            <section id="lifecycle" className="scroll-mt-28 space-y-6">
              <SectionHeading number="02" title="Claim lifecycle" />
              <ol className="divide-y divide-[#22242c] border-y border-[#22242c]">
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
                  title="Underwriter review window"
                  text="Underwriter can fast-path approve (100% indemnity release) or file a contest grievance with matching dispute deposit within the countdown window."
                />
                <LifecycleStep
                  number="04"
                  title="Claimant defense rebuttal"
                  text="If contested, claimant has a dedicated defense window to upload rebuttal documents or waive the timer for immediate trial."
                />
                <LifecycleStep
                  number="05"
                  title="AI magistrate consensus trial"
                  text="Validators independently fetch untrusted evidence URLs, run prompt analysis on policy wording vs. damage severity, and agree on continuous settlement BPS."
                />
                <LifecycleStep
                  number="06"
                  title="Continuous settlement disbarment"
                  text="Exact value conservation executes: indemnity payout is transferred to claimant, unencumbered balance returns to pool, and stakes are refunded or slashed."
                />
              </ol>
            </section>

            {/* 03: Basis Points Engine & Interactive Visualizer */}
            <section id="bps-engine" className="scroll-mt-28 space-y-6">
              <SectionHeading number="03" title="Basis points indemnity engine" />
              <p className="text-base sm:text-lg leading-relaxed text-[#9ea3b2]">
                Unlike conventional smart contracts that force a simplistic all-or-nothing binary outcome (100% payout or 0% denial), DamageAssessCourt implements continuous proportional indemnity from 0 to 10,000 Basis Points (BPS).
              </p>

              {/* Interactive BPS Simulator */}
              <div className="rounded-2xl border border-[#22242c] bg-[#0c0d10] p-6 sm:p-8 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                    <span>Interactive Settlement Calculator</span>
                  </h3>
                  <p className="text-xs text-[#8a8f9c] mt-1">
                    Simulate how GenLayer validators determine exact gross indemnity, deductibles, and stake refund or slashing.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-[#8a8f9c] uppercase text-xs mb-1.5 font-mono">
                      Claimed Amount (GEN)
                    </label>
                    <input
                      type="number"
                      value={calcClaimed}
                      onChange={(e) => setCalcClaimed(e.target.value)}
                      className="w-full rounded-xl border border-[#22242c] bg-[#141519] px-4 py-2.5 text-white font-mono focus:border-[#424554] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[#8a8f9c] uppercase text-xs mb-1.5 font-mono">
                      Settlement BPS: {calcBps} ({(calcBps / 100).toFixed(2)}%)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10000"
                      step="50"
                      value={calcBps}
                      onChange={(e) => setCalcBps(Number(e.target.value))}
                      className="w-full accent-white cursor-pointer mt-2"
                    />
                  </div>

                  <div>
                    <label className="block text-[#8a8f9c] uppercase text-xs mb-1.5 font-mono">
                      Claimant Anti-Spam Stake (GEN)
                    </label>
                    <input
                      type="number"
                      value={calcStake}
                      onChange={(e) => setCalcStake(e.target.value)}
                      className="w-full rounded-xl border border-[#22242c] bg-[#141519] px-4 py-2.5 text-white font-mono focus:border-[#424554] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[#22242c] font-mono text-xs">
                  <div className="rounded-xl bg-[#141519] p-4 border border-[#22242c]">
                    <span className="text-xs text-[#8a8f9c] uppercase block">Gross Indemnity</span>
                    <span className="text-base font-bold text-white mt-1 block">
                      {calcResult.grossPayout} GEN
                    </span>
                  </div>

                  <div className="rounded-xl bg-[#141519] p-4 border border-[#22242c]">
                    <span className="text-xs text-[#8a8f9c] uppercase block">Deductible Offset</span>
                    <span className="text-base font-bold text-[#8a8f9c] mt-1 block">
                      500 bps (5%)
                    </span>
                  </div>

                  <div className="rounded-xl bg-[#141519] p-4 border border-[#22242c]">
                    <span className="text-xs text-[#8a8f9c] uppercase block">Stake Disposition</span>
                    <span className={`text-base font-bold mt-1 block ${calcResult.claimantRefundedStake !== "0" ? "text-emerald-400" : "text-rose-400"}`}>
                      {calcResult.claimantRefundedStake !== "0" ? "Refunded" : "Slashed"}
                    </span>
                  </div>

                  <div className="rounded-xl bg-[#141519] p-4 border border-[#22242c]">
                    <span className="text-xs text-[#8a8f9c] uppercase block">Net Claimant Transfer</span>
                    <span className="text-base font-bold text-white mt-1 block">
                      {calcResult.netClaimantReceived} GEN
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* 04: Equivalence Principle & Jury */}
            <section id="consensus" className="scroll-mt-28 space-y-6">
              <SectionHeading number="04" title="Equivalence principle & jury" />
              <div className="grid gap-8 md:grid-cols-12">
                <p className="text-base sm:text-lg leading-relaxed text-[#9ea3b2] md:col-span-7">
                  GenLayer Intelligent Contracts evaluate non-deterministic tasks without relying on trusted central oracles. When adjudicating a claim, multiple independent validator nodes retrieve external media and feed structured prompts to LLMs. Consensus is reached using the Equivalence Principle: as long as validator judgments agree within bounded tolerance, the on-chain state transition finalizes.
                </p>
                <aside className="border-l-2 border-[#424554] pl-5 md:col-span-5">
                  <p className="font-mono text-xs uppercase tracking-wider text-white font-semibold">
                    UNTRUSTED INPUT RULE
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-[#9ea3b2]">
                    Submitted URLs and documents are treated strictly as evidence, never as execution instructions. Prompt injection attempts within submitted narratives are discarded by validator sandboxes.
                  </p>
                </aside>
              </div>
              <p className="text-base leading-relaxed text-[#9ea3b2]">
                If external media returns deterministic errors (such as HTTP 404 or 410), validators treat the missing item as unproven. If external infrastructure experiences transient errors (such as HTTP 429 rate limits or 503 gateway outages), the verdict records UNDETERMINED, preserving all escrow capital and allowing adjudication to be re-run safely.
              </p>
            </section>

            {/* 05: Contract Protections */}
            <section id="protections" className="scroll-mt-28 space-y-6">
              <SectionHeading number="05" title="Contract protections" />
              <ul className="grid gap-x-8 gap-y-3.5 border-t border-[#22242c] pt-6 sm:grid-cols-2 text-sm font-mono text-[#9ea3b2]">
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
            <section id="scope" className="scroll-mt-28 space-y-6">
              <SectionHeading number="06" title="System scope" />
              <div className="grid gap-px overflow-hidden rounded-2xl border border-[#22242c] bg-[#22242c] sm:grid-cols-2">
                <div className="bg-[#0c0d10] p-7 space-y-3.5">
                  <p className="font-mono text-xs uppercase tracking-wider text-white font-bold">
                    SUPPORTED IN CURRENT PROTOCOL
                  </p>
                  <ul className="space-y-2.5 text-sm leading-relaxed text-[#9ea3b2]">
                    <li>&bull; Commercial &amp; residential property structural damage.</li>
                    <li>&bull; Multi-peril definitions: Windstorm, Hail, Pipe burst, Flash flood.</li>
                    <li>&bull; Photographic evidence URLs with coordinate metadata.</li>
                    <li>&bull; External NOAA weather radar and police dispatch incident links.</li>
                    <li>&bull; Continuous 0 to 10,000 basis points indemnity settlement.</li>
                  </ul>
                </div>

                <div className="bg-[#0c0d10] p-7 space-y-3.5">
                  <p className="font-mono text-xs uppercase tracking-wider text-[#8a8f9c]">
                    FUTURE PROTOCOL EXTENSIONS
                  </p>
                  <ul className="space-y-2.5 text-sm leading-relaxed text-[#8a8f9c]">
                    <li>&bull; Automated drone photogrammetry and LIDAR point-cloud parsing.</li>
                    <li>&bull; Fiat stablecoin (USDC) native liquidity pools.</li>
                    <li>&bull; Reinsurance catastrophe bond tranche syndication.</li>
                    <li>&bull; Zero-knowledge private evidence proofs for sensitive commercial sites.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 07: Network & Risk */}
            <section id="network" className="scroll-mt-28 space-y-6">
              <SectionHeading number="07" title="Network & risk" />
              <div className="rounded-2xl border border-[#22242c] bg-[#0c0d10] p-7 sm:p-9 space-y-4">
                <p className="text-xl font-bold text-white">
                  DamageAssessCourt operates on GenLayer Studionet (Chain ID {STUDIONET_CHAIN_ID}).
                </p>
                <p className="text-sm sm:text-base leading-relaxed text-[#9ea3b2]">
                  This implementation is a functional decentralized intelligent contract demonstration running on GenLayer Studionet. Tokens held or transacted are testnet GEN and carry no monetary value. Gas fees and validator incentives are simulated by the network.
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-5 text-sm font-mono">
                  <a
                    className="text-white underline underline-offset-4 hover:text-[#c2c6d2] transition-colors"
                    href={`https://studio.genlayer.com/address/${DAMAGE_ASSESS_COURT_ADDRESS}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    INSPECT CONTRACT ON EXPLORER &rarr;
                  </a>
                  <span className="text-[#333640]">&middot;</span>
                  <a
                    className="text-[#8a8f9c] underline underline-offset-4 hover:text-white transition-colors"
                    href="https://github.com/9ytshade/damageassesscourt"
                    target="_blank"
                    rel="noreferrer"
                  >
                    CONTRACT SOURCE &amp; TEST SUITE &rarr;
                  </a>
                </div>
              </div>
            </section>

            {/* Bottom Navigation */}
            <div className="border-t border-[#22242c] pt-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <p className="text-2xl font-bold text-white">Proof of damage first. Settlement next.</p>
                <p className="text-sm text-[#9ea3b2] mt-1 font-mono">
                  Explore active claims or deploy your own underwriting facility.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/claims"
                  className="btn-pill-primary font-mono text-sm"
                >
                  Explore Docket &rarr;
                </Link>
                <Link
                  href="/policies"
                  className="btn-ghost font-mono text-sm"
                >
                  Risk Pools
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-3.5 border-b border-[#22242c] pb-4">
      <span className="font-mono text-xs font-bold text-white bg-[#18191e] px-2.5 py-1 rounded border border-[#2e313c]">
        {number}
      </span>
      <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white capitalize">
        {title}
      </h2>
    </div>
  );
}

function ProtocolCard({ index, title, text }: { index: string; title: string; text: string }) {
  return (
    <article className="bg-[#0c0d10] p-7 space-y-2.5 text-left">
      <p className="font-mono text-xs text-white font-bold">{index}</p>
      <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
      <p className="text-sm leading-relaxed text-[#9ea3b2]">{text}</p>
    </article>
  );
}

function LifecycleStep({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <li className="grid gap-2 py-6 sm:grid-cols-[44px_220px_1fr] sm:gap-5 items-start text-left">
      <span className="font-mono text-xs font-bold text-white bg-[#18191e] px-2 py-0.5 rounded border border-[#2e313c] inline-block w-fit">
        {number}
      </span>
      <h3 className="text-base font-bold text-white font-mono">{title}</h3>
      <p className="text-sm leading-relaxed text-[#9ea3b2]">{text}</p>
    </li>
  );
}

function Protection({ text }: { text: string }) {
  return (
    <li className="flex gap-3 items-start">
      <span className="text-white font-bold" aria-hidden="true">
        +
      </span>
      <span className="leading-relaxed">{text}</span>
    </li>
  );
}
