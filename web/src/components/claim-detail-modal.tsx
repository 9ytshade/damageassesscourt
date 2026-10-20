"use client";

import React from "react";
import Link from "next/link";
import { Claim } from "@/types/damageassesscourt";
import { formatAddress, formatWei, formatTimestamp } from "@/lib/safety";
import {
  GavelIcon,
  ShieldIcon,
  ExternalLinkIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  XCircleIcon,
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
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400 border border-amber-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            Review Window Open
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Approved
          </span>
        );
      case "contested":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-400 border border-rose-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-ping" />
            Contested / In Dispute
          </span>
        );
      case "defended":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-400 border border-purple-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
            Defended
          </span>
        );
      case "resolved":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400 border border-cyan-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            Settled by Court
          </span>
        );
      case "rejected_slashed":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400 border border-red-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
            Fraud Slashed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300 border border-slate-700">
            {claim.status}
          </span>
        );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="claim-detail-title"
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

        {/* Header Tag and Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pr-8">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#ffb829] bg-[#ffb829]/10 px-2.5 py-1 rounded border border-[#ffb829]/30">
              CLAIM #{claim.id}
            </span>
            <span className="font-mono text-xs text-[#8a8f98] bg-[#141518] px-2 py-1 rounded border border-[#23252a]">
              POLICY POOL #{claim.policy_id}
            </span>
          </div>
          {getStatusBadge(claim.status)}
        </div>

        {/* Title & Narrative */}
        <h2 id="claim-detail-title" className="text-2xl font-bold text-white tracking-tight">
          {claim.damage_title}
        </h2>
        <div className="mt-3 rounded-xl bg-[#141518] p-4 border border-[#23252a] text-sm text-[#d0d6e0] leading-relaxed max-h-40 overflow-y-auto">
          {claim.damage_description}
        </div>

        {/* Financial Overview Grid */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="rounded-xl bg-[#141518] p-3 border border-[#23252a]">
            <span className="text-[10px] text-[#8a8f98] block uppercase font-mono tracking-wider">
              Claimed Amount
            </span>
            <span className="font-mono text-sm font-bold text-[#ffb829] mt-1 block">
              {formatWei(claim.claimed_amount)} GEN
            </span>
          </div>

          <div className="rounded-xl bg-[#141518] p-3 border border-[#23252a]">
            <span className="text-[10px] text-[#8a8f98] block uppercase font-mono tracking-wider">
              Claimant Stake
            </span>
            <span className="font-mono text-sm font-bold text-slate-200 mt-1 block">
              {formatWei(claim.claimant_stake)} GEN
            </span>
          </div>

          <div className="rounded-xl bg-[#141518] p-3 border border-[#23252a]">
            <span className="text-[10px] text-[#8a8f98] block uppercase font-mono tracking-wider">
              Adjudicated BPS
            </span>
            <span className="font-mono text-sm font-bold text-[#8052ff] mt-1 block">
              {(claim.settlement_bps ?? 0) > 0 ? `${claim.settlement_bps} / 10,000` : "Pending Jury"}
            </span>
          </div>

          <div className="rounded-xl bg-[#141518] p-3 border border-[#23252a]">
            <span className="text-[10px] text-[#8a8f98] block uppercase font-mono tracking-wider">
              Approved Payout
            </span>
            <span className="font-mono text-sm font-bold text-emerald-400 mt-1 block">
              {claim.approved_payout ? `${formatWei(claim.approved_payout)} GEN` : "0 GEN"}
            </span>
          </div>
        </div>

        {/* Evidence Portfolio */}
        <div className="mt-5 space-y-2">
          <h3 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#8a8f98]">
            Attached Evidence Portfolio
          </h3>
          <div className="rounded-xl bg-[#141518] p-3 border border-[#23252a] space-y-2 text-xs">
            {claim.evidence_urls && claim.evidence_urls.length > 0 ? (
              <div className="space-y-1.5">
                {claim.evidence_urls.map((url, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-[#23252a] last:border-0">
                    <span className="text-[#8a8f98] font-mono text-[11px] truncate max-w-[280px] sm:max-w-[400px]">
                      {url}
                    </span>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#8052ff] hover:text-[#966eff] font-mono text-[11px] inline-flex items-center gap-1"
                    >
                      View Link <ExternalLinkIcon className="h-3 w-3" />
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#8a8f98] text-xs">No external URL evidence attached.</p>
            )}
          </div>
        </div>

        {/* Parties & Timestamp Metadata */}
        <div className="mt-5 rounded-xl bg-[#141518] p-3 border border-[#23252a] text-xs text-[#8a8f98] grid sm:grid-cols-2 gap-2">
          <div>
            <span className="block text-[10px] uppercase font-mono">Claimant:</span>
            <span className="font-mono text-slate-200">{claim.claimant}</span>
          </div>
          <div>
            <span className="block text-[10px] uppercase font-mono">Submitted At:</span>
            <span className="font-mono text-slate-200">{formatTimestamp(claim.submitted_at)}</span>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="mt-6 pt-4 border-t border-[#23252a] flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-[#23252a] text-xs font-semibold text-[#d0d6e0] hover:bg-[#1a1b1e] hover:text-white transition-colors"
          >
            Close Modal
          </button>

          <Link
            href={`/claims/${claim.id}`}
            onClick={onClose}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#8052ff] hover:bg-[#966eff] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-[#8052ff]/25"
          >
            <span>Open Workstation</span>
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
