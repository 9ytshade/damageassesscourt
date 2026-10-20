"use client";

import React from "react";
import Link from "next/link";
import { PolicyPool } from "@/types/damageassesscourt";
import { formatAddress, formatWei } from "@/lib/safety";
import { ShieldIcon, FileTextIcon, ArrowRightIcon } from "@/components/icons";

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
      className="flex flex-col justify-between rounded-xl border border-[#23252a] bg-[#0c0d0e] p-5 shadow-lg hover:border-[#383b3f] hover:-translate-y-0.5 transition-all cursor-pointer group"
    >
      <div>
        {/* Header: ID, status chip, title */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="font-mono text-xs font-semibold text-[#ffb829] bg-[#ffb829]/10 px-2 py-0.5 rounded border border-[#ffb829]/20">
            Pool #{policy.id}
          </span>
          <span
            className={`badge-status text-[10px] ${
              policy.is_active ? "badge-approved" : "badge-exhausted"
            }`}
          >
            {policy.is_active ? "Active Pool" : "Archived"}
          </span>
        </div>

        <h3 className="text-base font-semibold text-white tracking-tight line-clamp-1 group-hover:text-[#ffb829] transition-colors">
          {policy.title}
        </h3>
        <p className="mt-1 text-xs text-[#8a8f98] line-clamp-2 leading-relaxed">
          {policy.description}
        </p>

        {/* Metric Chips Grid */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[#23252a] text-xs">
          <div className="rounded-lg bg-[#141518] p-2 border border-[#23252a]">
            <span className="text-[10px] text-[#8a8f98] block uppercase font-medium">Escrow Capital</span>
            <span className="font-semibold text-emerald-400 font-mono text-xs">
              {formatWei(policy.total_escrow_pool)} GEN
            </span>
          </div>

          <div className="rounded-lg bg-[#141518] p-2 border border-[#23252a]">
            <span className="text-[10px] text-[#8a8f98] block uppercase font-medium">Max Claim Cap</span>
            <span className="font-semibold text-slate-200 font-mono text-xs">
              {formatWei(policy.max_claim_cap)} GEN
            </span>
          </div>

          <div className="rounded-lg bg-[#141518] p-2 border border-[#23252a]">
            <span className="text-[10px] text-[#8a8f98] block uppercase font-medium">Claimant Stake</span>
            <span className="font-medium text-slate-300 font-mono text-xs">
              {formatWei(policy.min_claimant_stake)} GEN
            </span>
          </div>

          <div className="rounded-lg bg-[#141518] p-2 border border-[#23252a]">
            <span className="text-[10px] text-[#8a8f98] block uppercase font-medium">Active Claims</span>
            <span className="font-medium text-[#ffb829] font-mono text-xs">
              {policy.active_claims_count} Active / {policy.settled_claims_count} Settled
            </span>
          </div>
        </div>

        {/* Underwriter info */}
        <div className="mt-3 flex items-center justify-between text-[11px] text-[#8a8f98]">
          <span>Underwriter:</span>
          <span className="font-mono text-slate-300">{formatAddress(policy.underwriter)}</span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-3 border-t border-[#23252a] flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        {policy.is_active && (
          onFileClaim ? (
            <button
              type="button"
              onClick={() => onFileClaim(policy)}
              className="flex-1 rounded-lg bg-[#ffb829] hover:bg-[#e5a420] py-1.5 px-3 text-xs font-semibold text-slate-950 transition-all shadow-sm shadow-[#ffb829]/20"
            >
              File Claim
            </button>
          ) : (
            <Link
              href={`/claims/submit?policyId=${policy.id}`}
              className="flex-1 rounded-lg bg-[#ffb829] hover:bg-[#e5a420] py-1.5 px-3 text-xs font-semibold text-slate-950 text-center transition-all shadow-sm shadow-[#ffb829]/20"
            >
              File Claim
            </Link>
          )
        )}
        <button
          type="button"
          onClick={() => onViewTerms?.(policy)}
          className="inline-flex items-center justify-center gap-1 rounded-lg border border-[#23252a] bg-[#141518] py-1.5 px-3 text-xs font-medium text-[#d0d6e0] hover:bg-[#23252a] hover:text-white transition-colors"
        >
          View Terms
        </button>
      </div>
    </div>
  );
}
