"use client";

import React from "react";
import Link from "next/link";
import { Claim } from "@/types/damageassesscourt";
import { formatAddress, formatWei, formatTimestamp } from "@/lib/safety";
import {
  ExternalLinkIcon,
  ArrowRightIcon,
} from "@/components/icons";

interface ClaimDetailModalProps {
  claim: Claim | null;
  onClose: () => void;
}

export function ClaimDetailModal({ claim, onClose }: ClaimDetailModalProps) {
  if (!claim) return null;

  const getStatusBadge = (status: Claim["status"]) => {
    switch (status) {
      case "submitted":
        return (
          <span className="badge-status badge-submitted">
            Review Window Open
          </span>
        );
      case "approved":
        return (
          <span className="badge-status badge-approved">
            Approved
          </span>
        );
      case "contested":
        return (
          <span className="badge-status badge-contested">
            Contested / In Dispute
          </span>
        );
      case "defended":
        return (
          <span className="badge-status badge-defended">
            Defended
          </span>
        );
      case "resolved":
        return (
          <span className="badge-status badge-resolved">
            Settled by Court
          </span>
        );
      case "rejected_slashed":
        return (
          <span className="badge-status badge-slashed">
            Fraud Slashed
          </span>
        );
      default:
        return (
          <span className="badge-status badge-exhausted">
            {status}
          </span>
        );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="claim-detail-title"
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

        {/* Header Tag and Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pr-10">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs font-bold text-white bg-[#18191e] px-3 py-1.5 rounded-lg border border-[#2d2f38]">
              CLAIM #{claim.id}
            </span>
            <span className="font-mono text-xs text-[#9ea3b2] bg-[#141519] px-3 py-1.5 rounded-lg border border-[#242630]">
              POLICY POOL #{claim.policy_id}
            </span>
          </div>
          {getStatusBadge(claim.status)}
        </div>

        {/* Title & Narrative */}
        <h2 id="claim-detail-title" className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          {claim.damage_title}
        </h2>
        <div className="mt-4 rounded-2xl bg-[#141519] p-5 border border-[#242630] text-sm sm:text-base text-[#d8dbe4] leading-relaxed max-h-48 overflow-y-auto">
          {claim.damage_description}
        </div>

        {/* Financial Overview Grid */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="rounded-2xl bg-[#141519] p-4 border border-[#242630]">
            <span className="text-xs text-[#8a8f9c] block uppercase font-mono tracking-wider">
              Claimed Amount
            </span>
            <span className="font-mono text-base font-bold text-white mt-1 block">
              {formatWei(claim.claimed_amount)} GEN
            </span>
          </div>

          <div className="rounded-2xl bg-[#141519] p-4 border border-[#242630]">
            <span className="text-xs text-[#8a8f9c] block uppercase font-mono tracking-wider">
              Claimant Stake
            </span>
            <span className="font-mono text-base font-bold text-[#d8dbe4] mt-1 block">
              {formatWei(claim.claimant_stake)} GEN
            </span>
          </div>

          <div className="rounded-2xl bg-[#141519] p-4 border border-[#242630]">
            <span className="text-xs text-[#8a8f9c] block uppercase font-mono tracking-wider">
              Adjudicated BPS
            </span>
            <span className="font-mono text-base font-bold text-white mt-1 block">
              {(claim.settlement_bps ?? 0) > 0 ? `${claim.settlement_bps} / 10,000` : "Pending Jury"}
            </span>
          </div>

          <div className="rounded-2xl bg-[#141519] p-4 border border-[#242630]">
            <span className="text-xs text-[#8a8f9c] block uppercase font-mono tracking-wider">
              Approved Payout
            </span>
            <span className="font-mono text-base font-bold text-emerald-400 mt-1 block">
              {claim.approved_payout ? `${formatWei(claim.approved_payout)} GEN` : "0 GEN"}
            </span>
          </div>
        </div>

        {/* Evidence Portfolio */}
        <div className="mt-6 space-y-2.5">
          <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-[#9ea3b2]">
            Attached Evidence Portfolio
          </h3>
          <div className="rounded-2xl bg-[#141519] p-4 border border-[#242630] space-y-2 text-xs">
            {claim.evidence_urls && claim.evidence_urls.length > 0 ? (
              <div className="space-y-2">
                {claim.evidence_urls.map((url, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1.5 border-b border-[#22242c] last:border-0">
                    <span className="text-[#8a8f9c] font-mono text-xs truncate max-w-[320px] sm:max-w-[480px]">
                      {url}
                    </span>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white hover:text-[#9ea3b2] font-mono text-xs inline-flex items-center gap-1.5"
                    >
                      View Link <ExternalLinkIcon className="h-3.5 w-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#8a8f9c] text-xs">No external URL evidence attached.</p>
            )}
          </div>
        </div>

        {/* Parties & Timestamp Metadata */}
        <div className="mt-6 rounded-2xl bg-[#141519] p-4 border border-[#242630] text-xs text-[#8a8f9c] grid sm:grid-cols-2 gap-3">
          <div>
            <span className="block text-xs uppercase font-mono text-[#8a8f9c]">Claimant:</span>
            <span className="font-mono text-white text-xs mt-0.5 block">{claim.claimant}</span>
          </div>
          <div>
            <span className="block text-xs uppercase font-mono text-[#8a8f9c]">Submitted At:</span>
            <span className="font-mono text-white text-xs mt-0.5 block">{formatTimestamp(claim.submitted_at)}</span>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="mt-8 pt-5 border-t border-[#22242c] flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full border border-[#282a32] text-sm font-semibold text-[#d8dbe4] hover:bg-[#1a1c22] hover:text-white transition-colors"
          >
            Close Modal
          </button>

          <Link
            href={`/claims/${claim.id}`}
            onClick={onClose}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full bg-white hover:bg-[#e5e7eb] text-black text-sm font-bold uppercase tracking-wider transition-all shadow-md"
          >
            <span>Open Workstation</span>
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
