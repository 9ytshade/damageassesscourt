"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Claim } from "@/types/damageassesscourt";
import { fetchTotals, DEMO_CLAIMS } from "@/lib/genlayer";
import { ClaimCard } from "@/components/claim-card";
import { ClaimDetailModal } from "@/components/claim-detail-modal";
import { GavelIcon, PlusIcon, ArrowRightIcon } from "@/components/icons";

export default function ClaimsDocketPage() {
  const [claims, setClaims] = useState<Claim[]>(DEMO_CLAIMS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);

  const filteredClaims = claims.filter((claim) => {
    // Status filter
    if (statusFilter === "active" && !["submitted", "contested", "defended"].includes(claim.status)) {
      return false;
    }
    if (statusFilter === "approved" && claim.status !== "approved") return false;
    if (statusFilter === "resolved" && claim.status !== "resolved") return false;
    if (statusFilter === "slashed" && claim.status !== "rejected_slashed") return false;

    // Search query
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      claim.damage_title.toLowerCase().includes(q) ||
      claim.damage_description.toLowerCase().includes(q) ||
      claim.claimant.toLowerCase().includes(q) ||
      claim.id.toString() === q ||
      claim.policy_id.toString() === q
    );
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#23252a] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#ffb829]/30 bg-[#ffb829]/10 px-3 py-1 text-xs font-mono text-[#ffb829] mb-2">
            <GavelIcon className="h-3.5 w-3.5" />
            <span>GENLAYER AI MAGISTRATE DOCKET</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-mono">
            Claims Docket
          </h1>
          <p className="mt-1 text-sm text-[#8a8f98]">
            Complete record of submitted damage filings, dispute rebuttals, and consensus basis-point settlements.
          </p>
        </div>

        <Link
          href="/claims/submit"
          className="btn-pill-gold font-mono self-start md:self-auto"
        >
          <PlusIcon className="h-4 w-4" />
          <span>File Damage Claim</span>
        </Link>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by title, description, claimant, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-[#23252a] bg-[#0c0d0e] px-4 py-2 text-xs text-white placeholder-[#62666d] focus:border-[#ffb829] focus:outline-none font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2 text-[#8a8f98] hover:text-white text-xs"
            >
              &times;
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
          {[
            { id: "all", label: "All" },
            { id: "active", label: "Review Window" },
            { id: "approved", label: "Approved" },
            { id: "resolved", label: "Settled" },
            { id: "slashed", label: "Fraud Slashed" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-full border transition-all ${
                statusFilter === tab.id
                  ? "border-[#ffb829] bg-[#ffb829]/10 text-[#ffb829] font-bold"
                  : "border-[#23252a] bg-[#0c0d0e] text-[#8a8f98] hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Claims Grid */}
      {filteredClaims.length === 0 ? (
        <div className="linear-card p-12 text-center text-[#8a8f98] font-mono text-sm space-y-3">
          <p>No claims match your search or filter criteria.</p>
          <button
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
            }}
            className="text-xs text-[#ffb829] underline underline-offset-4"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClaims.map((claim) => (
            <ClaimCard
              key={claim.id}
              claim={claim}
              onInspect={(c) => setSelectedClaim(c)}
            />
          ))}
        </div>
      )}

      {/* Expanded Modal */}
      <ClaimDetailModal
        claim={selectedClaim}
        onClose={() => setSelectedClaim(null)}
      />
    </div>
  );
}
