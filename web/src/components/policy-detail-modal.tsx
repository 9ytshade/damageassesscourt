"use client";

import React from "react";
import Link from "next/link";
import { PolicyPool } from "@/types/damageassesscourt";
import { formatAddress, formatWei } from "@/lib/safety";
import {
  ShieldIcon,
  FileTextIcon,
  CheckCircleIcon,
  ExternalLinkIcon,
  ArrowRightIcon,
} from "@/components/icons";

interface PolicyDetailModalProps {
  policy: PolicyPool | null;
  onClose: () => void;
  onFileClaim?: (policy: PolicyPool) => void;
}

export function PolicyDetailModal({ policy, onClose, onFileClaim }: PolicyDetailModalProps) {
  if (!policy) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="policy-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-[#23252a] bg-[#0c0d0e] p-6 sm:p-8 shadow-2xl relative my-8 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-[#8a8f98] hover:text-white text-xl font-bold w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#1a1b1e] transition-colors"
          aria-label="Close modal"
        >
          &times;
        </button>

        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pr-8">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#ffb829] bg-[#ffb829]/10 px-2.5 py-1 rounded border border-[#ffb829]/30">
              RISK POOL #{policy.id}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                policy.is_active
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  : "bg-slate-800 text-slate-400 border border-slate-700"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  policy.is_active ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
                }`}
              />
              {policy.is_active ? "Active Underwriting" : "Archived"}
            </span>
          </div>
        </div>

        {/* Title & Description */}
        <h2 id="policy-detail-title" className="text-2xl font-bold text-white tracking-tight">
          {policy.title}
        </h2>
        <p className="mt-2 text-sm text-[#8a8f98] leading-relaxed">
          {policy.description}
        </p>

        {/* Financial Metrics Grid */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="rounded-xl bg-[#141518] p-3 border border-[#23252a]">
            <span className="text-[10px] text-[#8a8f98] block uppercase font-mono tracking-wider">
              Total Escrow Capital
            </span>
            <span className="font-mono text-sm font-bold text-emerald-400 mt-1 block">
              {formatWei(policy.total_escrow_pool)} GEN
            </span>
          </div>

          <div className="rounded-xl bg-[#141518] p-3 border border-[#23252a]">
            <span className="text-[10px] text-[#8a8f98] block uppercase font-mono tracking-wider">
              Max Payout Cap
            </span>
            <span className="font-mono text-sm font-bold text-white mt-1 block">
              {formatWei(policy.max_claim_cap)} GEN
            </span>
          </div>

          <div className="rounded-xl bg-[#141518] p-3 border border-[#23252a]">
            <span className="text-[10px] text-[#8a8f98] block uppercase font-mono tracking-wider">
              Min Claimant Stake
            </span>
            <span className="font-mono text-sm font-bold text-slate-200 mt-1 block">
              {formatWei(policy.min_claimant_stake)} GEN
            </span>
          </div>

          <div className="rounded-xl bg-[#141518] p-3 border border-[#23252a]">
            <span className="text-[10px] text-[#8a8f98] block uppercase font-mono tracking-wider">
              Deductible BPS
            </span>
            <span className="font-mono text-sm font-bold text-[#ffb829] mt-1 block">
              {policy.deductible_bps ? `${policy.deductible_bps} bps` : "500 bps (5%)"}
            </span>
          </div>
        </div>

        {/* Covered Perils Checklist */}
        <div className="mt-5 space-y-2">
          <h3 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#8a8f98]">
            Covered Perils & Triggers
          </h3>
          <div className="flex flex-wrap gap-2">
            {(policy.covered_perils && policy.covered_perils.length > 0
              ? policy.covered_perils
              : ["Hurricane & Windstorm", "Hail & Roof Penetration", "Water Pipe Burst", "Flash Flood Surge"]
            ).map((peril, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#141518] px-3 py-1.5 text-xs text-[#d0d6e0] border border-[#23252a]"
              >
                <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-400" />
                {peril}
              </span>
            ))}
          </div>
        </div>

        {/* Verbatim Policy Terms & Exclusions */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#ffb829] flex items-center gap-1.5">
              <FileTextIcon className="h-3.5 w-3.5" />
              Verbatim Policy Terms & Exclusion Clauses
            </h3>
            <span className="text-[10px] text-[#8a8f98] font-mono">Governing Legal Text</span>
          </div>
          <div className="rounded-xl bg-[#08090a] p-4 border border-[#23252a] font-mono text-xs text-[#d0d6e0] leading-relaxed max-h-56 overflow-y-auto whitespace-pre-wrap selection:bg-[#ffb829]/30">
            {policy.policy_terms_text ||
              `SECTION 1. INDEMNITY COVERAGE
This decentralized insurance pool indemnifies the claimant against direct physical loss caused by specified perils during the active policy epoch.

SECTION 2. ADMISSIBLE EVIDENCE
Claims must be accompanied by non-fungible photographic evidence, geolocation-stamped weather radar reports, and/or municipal emergency dispatch incident numbers. Unsubstantiated claims will be dismissed.

SECTION 3. EXCLUSIONS & LIMITATIONS
No indemnity shall be paid for:
a) Pre-existing physical wear, tear, rust, gradual deterioration, or neglect.
b) Intentional damage, gross negligence, or fraudulent amplification of claimed loss.
c) Consequential business disruption or unrecorded auxiliary expenses.

SECTION 4. DISPUTE RESOLUTION
GenLayer AI consensus acts as the magistrate jury. All damage percentages (0-10,000 basis points) are evaluated by multi-validator consensus across policy language, physical imagery, and weather data. Settlement releases escrow directly to the claimant address upon finality.`}
          </div>
        </div>

        {/* Underwriter Metadata */}
        <div className="mt-5 rounded-xl bg-[#141518] p-3 border border-[#23252a] text-xs text-[#8a8f98] flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="block text-[10px] uppercase font-mono">Underwriter Address:</span>
            <span className="font-mono text-slate-200">{formatAddress(policy.underwriter)}</span>
          </div>
          <div>
            <span className="block text-[10px] uppercase font-mono">Claims Activity:</span>
            <span className="font-mono text-white">
              {policy.active_claims_count} Active / {policy.settled_claims_count} Settled
            </span>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="mt-6 pt-4 border-t border-[#23252a] flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-[#23252a] text-xs font-semibold text-[#d0d6e0] hover:bg-[#1a1b1e] hover:text-white transition-colors"
          >
            Close
          </button>

          {policy.is_active && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {onFileClaim ? (
                <button
                  onClick={() => {
                    onClose();
                    onFileClaim(policy);
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#ffb829] hover:bg-[#e5a420] text-black text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-[#ffb829]/25"
                >
                  <ShieldIcon className="h-4 w-4" />
                  <span>File Damage Claim</span>
                </button>
              ) : (
                <Link
                  href={`/claims/submit?policyId=${policy.id}`}
                  onClick={onClose}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#ffb829] hover:bg-[#e5a420] text-black text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-[#ffb829]/25"
                >
                  <ShieldIcon className="h-4 w-4" />
                  <span>File Damage Claim</span>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
