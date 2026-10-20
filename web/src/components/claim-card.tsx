"use client";

import React from "react";
import Link from "next/link";
import { Claim } from "@/types/damageassesscourt";
import { formatAddress, formatWei, formatTimestamp } from "@/lib/safety";
import { GavelIcon, ArrowRightIcon, ExternalLinkIcon, ShieldIcon } from "@/components/icons";

interface ClaimCardProps {
  claim: Claim;
}

export function ClaimCard({ claim }: ClaimCardProps) {
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

  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg hover:border-slate-700 transition-all">
      <div>
        {/* Top: ID, Policy ID, Status */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              Claim #{claim.id}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Policy #{claim.policy_id}
            </span>
          </div>
          {getStatusBadge(claim.status)}
        </div>

        {/* Title & Narrative */}
        <h4 className="text-sm font-semibold text-white tracking-tight line-clamp-1">
          {claim.damage_title}
        </h4>
        <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
          {claim.damage_description}
        </p>

        {/* Financial Metrics Chips */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-xs">
          <div className="rounded-lg bg-slate-950/60 p-2 border border-slate-800/60">
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Claimed Amount</span>
            <span className="font-semibold text-amber-400 font-mono text-xs">
              {formatWei(claim.claimed_amount)} GEN
            </span>
          </div>

          <div className="rounded-lg bg-slate-950/60 p-2 border border-slate-800/60">
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Claimant Stake</span>
            <span className="font-medium text-slate-300 font-mono text-xs">
              {formatWei(claim.claimant_stake)} GEN
            </span>
          </div>
        </div>

        {/* Evidence preview links */}
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
          <span>Claimant:</span>
          <span className="font-mono text-slate-300">{formatAddress(claim.claimant)}</span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">
          Submitted {formatTimestamp(claim.submitted_at)}
        </span>
        <Link
          href={`/claims/${claim.id}`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors border border-slate-700"
        >
          <span>Open Workstation</span>
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
