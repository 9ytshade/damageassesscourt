"use client";

import React from "react";
import Link from "next/link";
import { PolicyPool } from "@/types/damageassesscourt";
import { formatAddress, formatWei } from "@/lib/safety";

interface PolicyCardProps {
  policy: PolicyPool;
  onFileClaim?: (policy: PolicyPool) => void;
  onViewTerms?: (policy: PolicyPool) => void;
  onInspect?: (policy: PolicyPool) => void;
}

export function PolicyCard({ policy, onFileClaim, onViewTerms, onInspect }: PolicyCardProps) {
  const handleCardClick = () => {
    if (onInspect) {
      onInspect(policy);
    } else if (onViewTerms) {
      onViewTerms(policy);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="flex flex-col justify-between rounded-2xl border border-[#22242c] bg-[#0c0d10] p-6 shadow-lg hover:border-[#353843] hover:-translate-y-0.5 transition-all cursor-pointer group"
    >
      <div>
        {/* Header: ID, status chip, title */}
        <div className="flex items-center justify-between gap-3 mb-3.5">
          <span className="font-mono text-xs font-semibold text-[#f0f2f5] bg-[#16171b] px-3 py-1 rounded-lg border border-[#2b2d36]">
            Pool #{policy.id}
          </span>
          <span
            className={`badge-status ${
              policy.is_active ? "badge-approved" : "badge-exhausted"
            }`}
          >
            {policy.is_active ? "Active Pool" : "Archived"}
          </span>
        </div>

        <h3 className="text-base font-bold text-white tracking-tight line-clamp-1 group-hover:text-[#d8dbe4] transition-colors">
          {policy.title}
        </h3>
        <p className="mt-1.5 text-sm text-[#9ea3b2] line-clamp-2 leading-relaxed">
          {policy.description}
        </p>

        {/* Metric Chips Grid */}
        <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-[#1c1d23] text-xs">
          <div className="rounded-xl bg-[#141519] p-3 border border-[#22242c]">
            <span className="text-xs text-[#8a8f9c] block uppercase font-mono tracking-wider">Escrow Capital</span>
            <span className="font-bold text-emerald-400 font-mono text-sm mt-0.5 block">
              {formatWei(policy.total_escrow_pool)} GEN
            </span>
          </div>

          <div className="rounded-xl bg-[#141519] p-3 border border-[#22242c]">
            <span className="text-xs text-[#8a8f9c] block uppercase font-mono tracking-wider">Max Claim Cap</span>
            <span className="font-bold text-white font-mono text-sm mt-0.5 block">
              {formatWei(policy.max_claim_cap)} GEN
            </span>
          </div>

          <div className="rounded-xl bg-[#141519] p-3 border border-[#22242c]">
            <span className="text-xs text-[#8a8f9c] block uppercase font-mono tracking-wider">Claimant Stake</span>
            <span className="font-medium text-[#d8dbe4] font-mono text-sm mt-0.5 block">
              {formatWei(policy.min_claimant_stake)} GEN
            </span>
          </div>

          <div className="rounded-xl bg-[#141519] p-3 border border-[#22242c]">
            <span className="text-xs text-[#8a8f9c] block uppercase font-mono tracking-wider">Active Claims</span>
            <span className="font-medium text-white font-mono text-sm mt-0.5 block">
              {policy.active_claims_count} Active / {policy.settled_claims_count} Settled
            </span>
          </div>
        </div>

        {/* Underwriter info */}
        <div className="mt-4 flex items-center justify-between text-xs text-[#8a8f9c] pt-3 border-t border-[#1c1d23]">
          <span>Underwriter:</span>
          <span className="font-mono text-[#d8dbe4]">{formatAddress(policy.underwriter)}</span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-4 border-t border-[#1c1d23] flex items-center gap-2.5" onClick={(e) => e.stopPropagation()}>
        {policy.is_active && (
          onFileClaim ? (
            <button
              type="button"
              onClick={() => onFileClaim(policy)}
              className="flex-1 rounded-xl bg-white hover:bg-[#e5e7eb] py-2 px-3 text-xs font-semibold text-black transition-all shadow-sm"
            >
              File Claim
            </button>
          ) : (
            <Link
              href={`/claims/submit?policyId=${policy.id}`}
              className="flex-1 rounded-xl bg-white hover:bg-[#e5e7eb] py-2 px-3 text-xs font-semibold text-black text-center transition-all shadow-sm"
            >
              File Claim
            </Link>
          )
        )}
        <button
          type="button"
          onClick={() => onViewTerms?.(policy)}
          className="inline-flex items-center justify-center gap-1 rounded-xl border border-[#282a32] bg-[#16171b] py-2 px-3 text-xs font-medium text-[#d8dbe4] hover:bg-[#202127] hover:text-white transition-colors"
        >
          View Terms
        </button>
      </div>
    </div>
  );
}
