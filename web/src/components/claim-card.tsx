"use client";

import React from "react";
import Link from "next/link";
import { Claim } from "@/types/damageassesscourt";
import { formatAddress, formatWei, formatTimestamp } from "@/lib/safety";
import { GavelIcon, ArrowRightIcon, ExternalLinkIcon, ShieldIcon } from "@/components/icons";

interface ClaimCardProps {
  claim: Claim;
  onInspect?: (claim: Claim) => void;
}

export function ClaimCard({ claim, onInspect }: ClaimCardProps) {
  const getStatusBadge = (status: Claim["status"]) => {
    switch (status) {
      case "submitted":
        return <span className="badge-status badge-submitted">Review Window</span>;
      case "approved":
        return <span className="badge-status badge-approved">Approved</span>;
      case "contested":
        return <span className="badge-status badge-contested">Disputed</span>;
      case "defended":
        return <span className="badge-status badge-defended">Defended</span>;
      case "resolved":
        return <span className="badge-status badge-resolved">Settled by Court</span>;
      case "rejected_slashed":
        return <span className="badge-status badge-slashed">Fraud Slashed</span>;
      case "exhausted":
        return <span className="badge-status badge-exhausted">Exhausted</span>;
      default:
        return <span className="badge-status badge-exhausted">{status}</span>;
    }
  };

  const handleCardClick = () => {
    if (onInspect) {
      onInspect(claim);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="flex flex-col justify-between rounded-xl border border-[#23252a] bg-[#0c0d0e] p-5 shadow-lg hover:border-[#383b3f] hover:-translate-y-0.5 transition-all cursor-pointer group"
    >
      <div>
        {/* Top: ID, Policy ID, Status */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-[#ffb829] bg-[#ffb829]/10 px-2 py-0.5 rounded border border-[#ffb829]/20">
              Claim #{claim.id}
            </span>
            <span className="text-[11px] text-[#8a8f98] font-mono">
              Policy #{claim.policy_id}
            </span>
          </div>
          {getStatusBadge(claim.status)}
        </div>

        {/* Title & Narrative */}
        <h4 className="text-sm font-semibold text-white tracking-tight line-clamp-1 group-hover:text-[#ffb829] transition-colors">
          {claim.damage_title}
        </h4>
        <p className="mt-1 text-xs text-[#8a8f98] line-clamp-2 leading-relaxed">
          {claim.damage_description}
        </p>

        {/* Financial Metrics Chips */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[#23252a] text-xs">
          <div className="rounded-lg bg-[#141518] p-2 border border-[#23252a]">
            <span className="text-[10px] text-[#8a8f98] block uppercase font-medium">Claimed Amount</span>
            <span className="font-semibold text-[#ffb829] font-mono text-xs">
              {formatWei(claim.claimed_amount)} GEN
            </span>
          </div>

          <div className="rounded-lg bg-[#141518] p-2 border border-[#23252a]">
            <span className="text-[10px] text-[#8a8f98] block uppercase font-medium">Claimant Stake</span>
            <span className="font-medium text-slate-300 font-mono text-xs">
              {formatWei(claim.claimant_stake)} GEN
            </span>
          </div>
        </div>

        {/* Evidence preview links */}
        <div className="mt-3 flex items-center justify-between text-[11px] text-[#8a8f98] pt-2 border-t border-[#23252a]">
          <span>Claimant:</span>
          <span className="font-mono text-slate-300">{formatAddress(claim.claimant)}</span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-4 pt-3 border-t border-[#23252a] flex items-center justify-between">
        <span className="text-[11px] text-[#8a8f98]">
          Submitted {formatTimestamp(claim.submitted_at)}
        </span>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onInspect?.(claim)}
            className="inline-flex items-center gap-1 rounded-lg bg-[#141518] px-2.5 py-1 text-xs font-medium text-[#d0d6e0] hover:bg-[#23252a] hover:text-white transition-colors border border-[#23252a]"
          >
            Inspect
          </button>
          <Link
            href={`/claims/${claim.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#8052ff] hover:bg-[#966eff] px-3 py-1.5 text-xs font-semibold text-white transition-colors shadow-sm shadow-[#8052ff]/20"
          >
            <span>Workstation</span>
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
