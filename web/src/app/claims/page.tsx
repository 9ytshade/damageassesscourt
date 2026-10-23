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
    <div className="w-full pb-20 space-y-10 animate-fade-in">
      {/* Full-Width Top Header Banner matching Landing Page */}
      <section className="relative w-full border-b border-[#22242c] bg-[#000000] py-12 lg:py-16">
        <div className="mx-auto max-w-[1536px] w-full px-5 sm:px-8 lg:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#2a2d36] bg-[#121317] px-4 py-1.5 text-xs font-mono text-[#d8dbe4]">
                <GavelIcon className="h-4 w-4 text-[#a4a8b7]" />
                <span>GENLAYER AI MAGISTRATE DOCKET</span>
              </div>
              <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white font-mono">
                Claims Docket
              </h1>
              <p className="text-base sm:text-lg text-[#9ea3b2] max-w-3xl leading-relaxed">
                Complete public docket of submitted property damage filings, underwriter dispute briefs,
                claimant defense rebuttals, and consensus basis-point settlements executed on GenLayer.
              </p>
            </div>

            <Link
              href="/claims/submit"
              className="btn-pill-primary font-mono self-start md:self-auto shrink-0"
            >
              <PlusIcon className="h-4 w-4" />
              <span>File Damage Claim</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content Area matching 1536px grid */}
      <div className="mx-auto max-w-[1536px] w-full px-5 sm:px-8 lg:px-12 space-y-8">
        {/* Search & Filter Toolbar spanning full container width */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-2 rounded-2xl border border-[#22242c] bg-[#101115]">
          {/* Search Input expands to fill space */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search docket by damage description, claimant, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-transparent bg-[#16171d] px-4 py-2.5 text-sm text-[#f0f2f5] placeholder-[#6e7282] focus:border-[#424554] focus:outline-none transition-colors font-mono"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8a8f9c] hover:text-white"
              >
                &times;
              </button>
            )}
          </div>

          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            {[
              { id: "all", label: "All Claims" },
              { id: "active", label: "Active Review" },
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
                    : "border-[#22242c] bg-[#16171d] text-[#8a8f9c] hover:text-white hover:bg-[#20222a]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Claims Grid matching full wide layout */}
        {filteredClaims.length === 0 ? (
          <div className="rounded-3xl border border-[#22242c] bg-[#141519]/70 p-16 text-center text-[#8a8f9c] font-mono text-sm space-y-3">
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
      </div>

      {/* Expanded Modal */}
      <ClaimDetailModal
        claim={selectedClaim}
        onClose={() => setSelectedClaim(null)}
      />
    </div>
  );
}
