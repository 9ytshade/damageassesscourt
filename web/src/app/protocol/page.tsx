"use client";

import React, { useState } from "react";
import { calculateBpsSettlement, formatWeiAmount } from "@/lib/safety";
import { GavelIcon, ShieldCheckIcon, SparklesIcon, CheckCircleIcon } from "@/components/icons";

export default function ProtocolSpecPage() {
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
    <div className="space-y-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-court-amber/40 bg-court-amber/10 text-xs font-mono text-court-amber">
          <SparklesIcon className="h-3.5 w-3.5" />
          <span>Protocol Technical Specification</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-serif">
          DamageAssessCourt Protocol & Mathematical Engine
        </h1>
        <p className="text-sm sm:text-base text-slate-300">
          Autonomous multi-validator insurance court on GenLayer adjudicating complex property damage through continuous Basis Points (BPS) indemnity math.
        </p>
      </div>

      {/* Why GenLayer Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 sm:p-8 space-y-4">
        <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
          <GavelIcon className="h-5 w-5 text-court-amber" />
          Why GenLayer is Required for Complex Claims
        </h2>
        <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
          <p>
            Standard Web3 insurance relies on naive binary parametric triggers: if anemometer wind speed exceeds 75 mph, the policy pays 100%; otherwise 0%. Real-world insurance fails under this paradigm:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2 text-slate-300">
            <li>
              <strong className="text-white">Pre-existing Wear vs. Storm Shear:</strong> A hurricane may tear off a warehouse roof, but 30% of the contractor invoice replaces rusted structural beams that were already corroded before the storm.
            </li>
            <li>
              <strong className="text-white">Ambiguous Policy Exclusion Clauses:</strong> Commercial policies routinely exclude cosmetic damage, gradual rot, or unmitigated water accumulation while covering sudden opening penetration.
            </li>
            <li>
              <strong className="text-white">Non-Deterministic Evaluation:</strong> No single smart contract or centralized oracle can parse contractor PDFs, photographic evidence, and official NOAA logs without bias.
            </li>
          </ul>
          <p>
            GenLayer provides Intelligent Contracts executing under the Equivalence Principle. Independent validators separately fetch off-chain documents, query AI models with structured prompts, and reach consensus on a continuous settlement outcome.
          </p>
        </div>
      </div>

      {/* Basis Points (BPS) Calculator Widget */}
      <div className="rounded-2xl border border-court-amber/40 bg-slate-900/60 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
              <SparklesIcon className="h-5 w-5 text-court-amber" />
              Interactive Basis Points (BPS) Math Simulator
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Simulate exact integer arithmetic and value conservation across the 10,000 BPS spectrum.
            </p>
          </div>
          <div className="px-3 py-1 rounded-full bg-court-amber/10 border border-court-amber/30 text-xs font-mono text-court-amber font-bold">
            0.01% Resolution
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div>
            <label className="block uppercase text-slate-400 mb-1">Claimed Amount (Wei/USD)</label>
            <input
              type="number"
              value={calcClaimed}
              onChange={(e) => setCalcClaimed(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono focus:border-court-amber focus:outline-none"
            />
          </div>

          <div>
            <label className="block uppercase text-slate-400 mb-1">
              Consensus Settlement: {calcBps} BPS ({(calcBps / 100).toFixed(2)}%)
            </label>
            <input
              type="range"
              min="0"
              max="10000"
              step="50"
              value={calcBps}
              onChange={(e) => setCalcBps(Number(e.target.value))}
              className="w-full accent-amber-400 mt-2"
            />
          </div>

          <div>
            <label className="block uppercase text-slate-400 mb-1">Anti-Spam Stake & Deposit</label>
            <input
              type="number"
              value={calcStake}
              onChange={(e) => setCalcStake(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono focus:border-court-amber focus:outline-none"
            />
          </div>
        </div>

        {/* Calculation Result */}
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-400 block uppercase">Indemnity Share</span>
              <span className="text-base font-bold text-amber-300">
                {formatWeiAmount(calcResult.indemnityShare)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block uppercase">Insurer Retained</span>
              <span className="text-base font-bold text-slate-200">
                {formatWeiAmount(calcResult.insurerRetained)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block uppercase">Claimant Total Payout</span>
              <span className="text-base font-bold text-emerald-400">
                {formatWeiAmount(calcResult.claimantTotalPayout)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block uppercase">Underwriter Refund</span>
              <span className="text-base font-bold text-sky-400">
                {formatWeiAmount(calcResult.underwriterRefund)}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-900 text-xs font-mono text-emerald-400/90 flex items-center justify-between">
            <span>Conservation Invariant: indemnity_share + insurer_retained == claimed_amount</span>
            <span className="text-slate-300">
              {calcResult.indemnityShare + calcResult.insurerRetained === calcResult.claimedAmount
                ? "[VERIFIED EQUAL]"
                : "[MATH MISMATCH]"}
            </span>
          </div>
        </div>
      </div>

      {/* The 4 Canonical Verdicts */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
          <ShieldCheckIcon className="h-5 w-5 text-emerald-400" />
          The 4 Canonical Verdict States
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/10 p-5 space-y-2">
            <div className="flex items-center justify-between font-mono">
              <span className="font-bold text-emerald-400">FULL_INDEMNITY</span>
              <span className="text-xs text-emerald-300">10,000 BPS (100%)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              All contractor line items match policy inclusions and weather event severity. Claimant receives full claimed amount + returned anti-spam stake + underwriter dispute deposit as contest penalty.
            </p>
          </div>

          <div className="rounded-xl border border-amber-900/40 bg-amber-950/10 p-5 space-y-2">
            <div className="flex items-center justify-between font-mono">
              <span className="font-bold text-amber-400">PARTIAL_SETTLEMENT</span>
              <span className="text-xs text-amber-300">1 to 9,999 BPS</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Partial exclusions applied (e.g. 68.5% storm repair approved, 31.5% deducted for pre-existing rust). Claimant receives proportional indemnity + stake returned; underwriter deposit returned.
            </p>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-5 space-y-2">
            <div className="flex items-center justify-between font-mono">
              <span className="font-bold text-slate-300">CLAIM_DENIED</span>
              <span className="text-xs text-slate-400">0 BPS (0%)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Legitimate policy exclusion (e.g. water damage caused entirely by pre-existing roof failure prior to storm). Full claim returned to pool; honest claimant receives stake back; underwriter deposit refunded.
            </p>
          </div>

          <div className="rounded-xl border border-red-900/40 bg-red-950/10 p-5 space-y-2">
            <div className="flex items-center justify-between font-mono">
              <span className="font-bold text-red-400">FRAUD_SLASHED</span>
              <span className="text-xs text-red-300">0 BPS (Slashed)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Dead links (404/410) or fraudulent contractor invoices detected. Claimant anti-spam stake is permanently slashed into the policy pool; claim liability returned; underwriter deposit refunded.
            </p>
          </div>
        </div>
      </div>

      {/* Security Invariants & Liveness Safeguards */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 sm:p-8 space-y-4">
        <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
          <ShieldCheckIcon className="h-5 w-5 text-court-amber" />
          Protocol Security Invariants & Liveness Guarantees
        </h2>

        <div className="space-y-4 text-xs text-slate-300">
          <div className="flex items-start gap-3">
            <CheckCircleIcon className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            <div>
              <strong className="text-white block font-mono">Strict Value Conservation:</strong>
              The sum of claimant indemnity share and insurer retained share exactly matches the sequestered claim amount. No funds are created or destroyed.
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircleIcon className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            <div>
              <strong className="text-white block font-mono">Transient Error Safeguard:</strong>
              If an external server returns HTTP 5xx or times out, validators vote TRANSIENT_ERROR without penalizing the claimant. Re-trials can occur up to 5 attempts.
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircleIcon className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            <div>
              <strong className="text-white block font-mono">Terminal Exhaustion Recovery:</strong>
              If an external server remains persistently offline across 5 attempts or 86,400 seconds, any party can call resolve_exhausted_claim() to safely unlock funds.
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircleIcon className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            <div>
              <strong className="text-white block font-mono">Anti-Replay Evidence Locking:</strong>
              Settled contractor invoice URLs are recorded on-chain, preventing double-filing or recycling across policy pools.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
