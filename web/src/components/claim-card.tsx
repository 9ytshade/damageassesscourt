"use client";

import React from "react";
import Link from "next/link";
import { Claim } from "@/types/damageassesscourt";
import { formatAddress, formatWei, formatTimestamp } from "@/lib/safety";
import { ArrowRightIcon } from "@/components/icons";

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
      className="flex flex-col justify-between rounded-2xl border border-[#22242c] bg-[#0c0d10] p-6 shadow-lg hover:border-[#353843] hover:-translate-y-0.5 transition-all cursor-pointer group"
    >
      <div>
        {/* Top: ID, Policy ID, Status */}
        <div className="flex items-center justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-[#f0f2f5] bg-[#16171b] px-3 py-1 rounded-lg border border-[#2b2d36]">
              Claim #{claim.id}
            </span>
            <span className="text-xs text-[#8a8f9c] font-mono">
              Policy #{claim.policy_id}
            </span>
          </div>
          {getStatusBadge(claim.status)}
        </div>

        {/* Title & Narrative */}
        <h4 className="text-base font-bold text-white tracking-tight line-clamp-1 group-hover:text-[#d8dbe4] transition-colors">
          {claim.damage_title}
        </h4>
        <p className="mt-1.5 text-sm text-[#9ea3b2] line-clamp-2 leading-relaxed">
          {claim.damage_description}
        </p>

        {/* Financial Metrics Chips */}
        <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-[#1c1d23] text-xs">
          <div className="rounded-xl bg-[#141519] p-3 border border-[#22242c]">
            <span className="text-xs text-[#8a8f9c] block uppercase font-mono tracking-wider">
              Claimed Amount
            </span>
            <span className="font-bold text-white font-mono text-sm mt-0.5 block">
              {formatWei(claim.claimed_amount)} GEN
            </span>
          </div>

          <div className="rounded-xl bg-[#141519] p-3 border border-[#22242c]">
            <span className="text-xs text-[#8a8f9c] block uppercase font-mono tracking-wider">
              Claimant Stake
            </span>
            <span className="font-medium text-[#d8dbe4] font-mono text-sm mt-0.5 block">
              {formatWei(claim.claimant_stake)} GEN
            </span>
          </div>
        </div>

        {/* Claimant info */}
        <div className="mt-4 flex items-center justify-between text-xs text-[#8a8f9c] pt-3 border-t border-[#1c1d23]">
          <span>Claimant:</span>
          <span className="font-mono text-[#d8dbe4]">{formatAddress(claim.claimant)}</span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-4 border-t border-[#1c1d23] flex items-center justify-between">
        <span className="text-xs text-[#8a8f9c]">
          Submitted {formatTimestamp(claim.submitted_at)}
        </span>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onInspect?.(claim)}
            className="inline-flex items-center gap-1 rounded-xl bg-[#16171b] px-3.5 py-1.5 text-xs font-medium text-[#d8dbe4] hover:bg-[#202127] hover:text-white transition-colors border border-[#282a32]"
          >
            Inspect
          </button>
          <Link
            href={`/claims/${claim.id}`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white hover:bg-[#e5e7eb] px-3.5 py-1.5 text-xs font-semibold text-black transition-colors shadow-sm"
          >
            <span>Workstation</span>
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
