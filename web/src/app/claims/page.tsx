"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Claim } from "@/types/damageassesscourt";
import { DEMO_CLAIMS } from "@/lib/genlayer";
import { ClaimCard } from "@/components/claim-card";
import { ClaimDetailModal } from "@/components/claim-detail-modal";
import { GavelIcon, PlusIcon } from "@/components/icons";

export default function ClaimsDocketPage() {
  const [claims] = useState<Claim[]>(DEMO_CLAIMS);
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
    <div className="mx-auto max-w-[1536px] w-full px-5 sm:px-8 lg:px-12 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#22242c] pb-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#2a2d36] bg-[#121317] px-4 py-1.5 text-xs font-mono text-[#d8dbe4] mb-3">
            <GavelIcon className="h-4 w-4 text-[#a4a8b7]" />
            <span>GENLAYER AI MAGISTRATE DOCKET</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white font-mono">
            Claims Docket
          </h1>
          <p className="mt-2 text-base text-[#9ea3b2] max-w-2xl">
            Complete record of submitted damage filings, dispute rebuttals, and consensus basis-point settlements.
          </p>
        </div>

        <Link
          href="/claims/submit"
          className="btn-pill-primary font-mono self-start md:self-auto"
        >
          <PlusIcon className="h-4 w-4" />
          <span>File Damage Claim</span>
        </Link>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-lg">
          <input
            type="text"
            placeholder="Search by title, description, claimant, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-[#242630] bg-[#0c0d10] px-5 py-2.5 text-sm text-white placeholder-[#686c7b] focus:border-[#424554] focus:outline-none font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-2.5 text-[#9ea3b2] hover:text-white text-sm"
            >
              &times;
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
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
              className={`px-4 py-2 rounded-full border transition-all text-xs font-semibold ${
                statusFilter === tab.id
                  ? "border-[#484c59] bg-[#1e2027] text-white"
                  : "border-[#22242c] bg-[#0c0d10] text-[#8a8f9c] hover:text-white hover:bg-[#141519]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Claims Grid */}
      {filteredClaims.length === 0 ? (
        <div className="linear-card p-16 text-center text-[#8a8f9c] font-mono text-sm space-y-3">
          <p>No claims match your search or filter criteria.</p>
          <button
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
            }}
            className="text-xs text-white underline underline-offset-4"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
