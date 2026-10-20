"use client";

import React from "react";
import Link from "next/link";
import { PolicyPool } from "@/types/damageassesscourt";
import { formatAddress, formatWei } from "@/lib/safety";
import {
  ShieldIcon,
  FileTextIcon,
  CheckCircleIcon,
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-3xl border border-[#242630] bg-[#0d0e12] p-7 sm:p-10 shadow-2xl relative my-8 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-6 top-6 text-[#9ea3b2] hover:text-white text-2xl font-bold w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#1a1c22] transition-colors"
          aria-label="Close modal"
        >
          &times;
        </button>

        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pr-10">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs font-bold text-white bg-[#18191e] px-3 py-1.5 rounded-lg border border-[#2d2f38]">
              RISK POOL #{policy.id}
            </span>
            <span
              className={`badge-status ${
                policy.is_active ? "badge-approved" : "badge-exhausted"
              }`}
            >
              {policy.is_active ? "Active Underwriting" : "Archived"}
            </span>
          </div>
        </div>

        {/* Title & Description */}
        <h2 id="policy-detail-title" className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          {policy.title}
        </h2>
        <p className="mt-2.5 text-sm sm:text-base text-[#9ea3b2] leading-relaxed">
          {policy.description}
        </p>

        {/* Financial Metrics Grid */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="rounded-2xl bg-[#141519] p-4 border border-[#242630]">
            <span className="text-xs text-[#8a8f9c] block uppercase font-mono tracking-wider">
              Total Escrow Capital
            </span>
            <span className="font-mono text-base font-bold text-emerald-400 mt-1 block">
              {formatWei(policy.total_escrow_pool)} GEN
            </span>
          </div>

          <div className="rounded-2xl bg-[#141519] p-4 border border-[#242630]">
            <span className="text-xs text-[#8a8f9c] block uppercase font-mono tracking-wider">
              Max Payout Cap
            </span>
            <span className="font-mono text-base font-bold text-white mt-1 block">
              {formatWei(policy.max_claim_cap)} GEN
            </span>
          </div>

          <div className="rounded-2xl bg-[#141519] p-4 border border-[#242630]">
            <span className="text-xs text-[#8a8f9c] block uppercase font-mono tracking-wider">
              Min Claimant Stake
            </span>
            <span className="font-mono text-base font-bold text-[#d8dbe4] mt-1 block">
              {formatWei(policy.min_claimant_stake)} GEN
            </span>
          </div>

          <div className="rounded-2xl bg-[#141519] p-4 border border-[#242630]">
            <span className="text-xs text-[#8a8f9c] block uppercase font-mono tracking-wider">
              Deductible BPS
            </span>
            <span className="font-mono text-base font-bold text-white mt-1 block">
              {policy.deductible_bps ? `${policy.deductible_bps} bps` : "500 bps (5%)"}
            </span>
          </div>
        </div>

        {/* Covered Perils Checklist */}
        <div className="mt-6 space-y-2.5">
          <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-[#9ea3b2]">
            Covered Perils &amp; Triggers
          </h3>
          <div className="flex flex-wrap gap-2.5">
            {(policy.covered_perils && policy.covered_perils.length > 0
              ? policy.covered_perils
              : ["Hurricane & Windstorm", "Hail & Roof Penetration", "Water Pipe Burst", "Flash Flood Surge"]
            ).map((peril, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-2 rounded-xl bg-[#141519] px-3.5 py-2 text-xs font-medium text-[#d8dbe4] border border-[#242630]"
              >
                <CheckCircleIcon className="h-4 w-4 text-emerald-400" />
                {peril}
              </span>
            ))}
          </div>
        </div>

        {/* Verbatim Policy Terms & Exclusions */}
        <div className="mt-6 space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-white flex items-center gap-2">
              <FileTextIcon className="h-4 w-4 text-[#9ea3b2]" />
              Verbatim Policy Terms &amp; Exclusion Clauses
            </h3>
            <span className="text-xs text-[#8a8f9c] font-mono">Governing Legal Text</span>
          </div>
          <div className="rounded-2xl bg-[#08090b] p-5 border border-[#242630] font-mono text-xs text-[#d8dbe4] leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap">
            {policy.policy_terms_text || policy.policy_terms ||
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
        <div className="mt-6 rounded-2xl bg-[#141519] p-4 border border-[#242630] text-xs text-[#8a8f9c] flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="block text-xs uppercase font-mono text-[#8a8f9c]">Underwriter Address:</span>
            <span className="font-mono text-[#d8dbe4] mt-0.5 block">{formatAddress(policy.underwriter)}</span>
          </div>
          <div>
            <span className="block text-xs uppercase font-mono text-[#8a8f9c]">Claims Activity:</span>
            <span className="font-mono text-white mt-0.5 block">
              {policy.active_claims_count} Active / {policy.settled_claims_count} Settled
            </span>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="mt-8 pt-5 border-t border-[#22242c] flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full border border-[#282a32] text-sm font-semibold text-[#d8dbe4] hover:bg-[#1a1c22] hover:text-white transition-colors"
          >
            Close
          </button>

          {policy.is_active && (
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {onFileClaim ? (
                <button
                  onClick={() => {
                    onClose();
                    onFileClaim(policy);
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full bg-white hover:bg-[#e5e7eb] text-black text-sm font-bold uppercase tracking-wider transition-all shadow-md"
                >
                  <ShieldIcon className="h-4 w-4" />
                  <span>File Damage Claim</span>
                </button>
              ) : (
                <Link
                  href={`/claims/submit?policyId=${policy.id}`}
                  onClick={onClose}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full bg-white hover:bg-[#e5e7eb] text-black text-sm font-bold uppercase tracking-wider transition-all shadow-md"
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
