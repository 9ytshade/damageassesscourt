"use client";

import React from "react";
import Link from "next/link";
import { PolicyPool } from "@/types/damageassesscourt";
import { formatAddress, formatWei } from "@/lib/safety";
import { ShieldIcon, FileTextIcon, ArrowRightIcon } from "@/components/icons";

interface PolicyCardProps {
  policy: PolicyPool;
  onFileClaim?: (policy: PolicyPool) => void;
}

export function PolicyCard({ policy, onFileClaim }: PolicyCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg hover:border-slate-700 transition-all">
      <div>
        {/* Header: ID, status chip, title */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="font-mono text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
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

        <h3 className="text-base font-semibold text-white tracking-tight line-clamp-1">
          {policy.title}
        </h3>
        <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
          {policy.description}
        </p>

        {/* Metric Chips Grid */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-xs">
          <div className="rounded-lg bg-slate-950/60 p-2 border border-slate-800/60">
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Escrow Capital</span>
            <span className="font-semibold text-emerald-400 font-mono text-xs">
              {formatWei(policy.total_escrow_pool)} GEN
            </span>
          </div>

          <div className="rounded-lg bg-slate-950/60 p-2 border border-slate-800/60">
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Max Claim Cap</span>
            <span className="font-semibold text-slate-200 font-mono text-xs">
              {formatWei(policy.max_claim_cap)} GEN
            </span>
          </div>

          <div className="rounded-lg bg-slate-950/60 p-2 border border-slate-800/60">
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Claimant Stake</span>
            <span className="font-medium text-slate-300 font-mono text-xs">
              {formatWei(policy.min_claimant_stake)} GEN
            </span>
          </div>

          <div className="rounded-lg bg-slate-950/60 p-2 border border-slate-800/60">
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Active Claims</span>
            <span className="font-medium text-amber-400 font-mono text-xs">
              {policy.active_claims_count} Active / {policy.settled_claims_count} Settled
            </span>
          </div>
        </div>

        {/* Underwriter info */}
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
          <span>Underwriter:</span>
          <span className="font-mono text-slate-300">{formatAddress(policy.underwriter)}</span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center gap-2">
        {policy.is_active && onFileClaim && (
          <button
            onClick={() => onFileClaim(policy)}
            className="flex-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 py-1.5 px-3 text-xs font-semibold text-slate-950 hover:from-amber-400 hover:to-amber-500 transition-all shadow-sm shadow-amber-500/20"
          >
            File Damage Claim
          </button>
        )}
        <Link
          href={`/policies#pool-${policy.id}`}
          className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-700 bg-slate-800 py-1.5 px-3 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
        >
          View Terms
        </Link>
      </div>
    </div>
  );
}
