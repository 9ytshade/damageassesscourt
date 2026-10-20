"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Claim, PolicyPool } from "@/types/damageassesscourt";
import { fetchAllPolicies, fetchTotals, DEMO_CLAIMS } from "@/lib/genlayer";
import { PolicyCard } from "@/components/policy-card";
import { ClaimCard } from "@/components/claim-card";
import { ClaimDetailModal } from "@/components/claim-detail-modal";
import { PolicyDetailModal } from "@/components/policy-detail-modal";
import { CreatePolicyModal } from "@/components/create-policy-modal";
import { FileClaimModal } from "@/components/file-claim-modal";
import { HeroConstellation } from "@/components/hero-constellation";
import {
  GavelIcon,
  ShieldCheckIcon,
  SparklesIcon,
  BuildingOfficeIcon,
  PlusIcon,
  ArrowRightIcon,
} from "@/components/icons";

export default function DashboardPage() {
  const [policies, setPolicies] = useState<PolicyPool[]>([]);
  const [claims, setClaims] = useState<Claim[]>(DEMO_CLAIMS);
  const [totals, setTotals] = useState({ policyCount: 0, claimCount: 0, verdictCount: 0 });
  const [loading, setLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isFileClaimOpen, setIsFileClaimOpen] = useState(false);
  const [selectedPolicyForClaim, setSelectedPolicyForClaim] = useState<PolicyPool | null>(null);
  const [selectedClaimForDetail, setSelectedClaimForDetail] = useState<Claim | null>(null);
  const [selectedPolicyForDetail, setSelectedPolicyForDetail] = useState<PolicyPool | null>(null);

  const [claimFilter, setClaimFilter] = useState<string>("all");

  async function loadData() {
    setLoading(true);
    try {
      const [policiesRes, totalsRes] = await Promise.all([
        fetchAllPolicies(0, 10),
        fetchTotals(),
      ]);
      setPolicies(policiesRes.policies);
      setIsFallback(policiesRes.isFallback);
      setTotals(totalsRes);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleOpenFileClaim(policy: PolicyPool) {
    setSelectedPolicyForClaim(policy);
    setIsFileClaimOpen(true);
  }

  const filteredClaims = claims.filter((c) => {
    if (claimFilter === "all") return true;
    if (claimFilter === "active") return ["submitted", "contested", "defended"].includes(c.status);
    if (claimFilter === "resolved") return c.status === "resolved";
    if (claimFilter === "slashed") return c.status === "rejected_slashed";
    return c.status === claimFilter;
  });

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section with Interactive 3D Constellation */}
      <section className="relative overflow-hidden border-b border-[#22242c] bg-[#000000] pt-8 pb-16 lg:py-24">
        <div className="mx-auto max-w-[1536px] px-5 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Headline & Narrative Column */}
            <div className="lg:col-span-7 space-y-7 text-left z-10">
              {/* Category Pill Tag */}
              <div className="inline-flex items-center gap-2 rounded-full border border-[#2a2d36] bg-[#121317] px-4 py-1.5 text-xs font-mono text-[#d8dbe4]">
                <SparklesIcon className="h-3.5 w-3.5 text-[#a4a8b7]" />
                <span>GENLAYER STUDIONET 61999 &middot; DAMAGE COURT</span>
              </div>

              {/* Oversized High-Contrast Headline */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.04]">
                Where Ambiguous Damage Meets On-Chain Consensus.
              </h1>

              {/* Clear Precision Narrative */}
              <p className="text-base sm:text-xl text-[#9ea3b2] leading-relaxed max-w-2xl">
                Beyond binary parametric triggers. DamageAssessCourt settles catastrophic property claims by
                cross-examining physical site photography, weather radar feeds, and ambiguous policy exclusion
                clauses through multi-validator AI consensus and continuous 0 to 10,000 Basis Points indemnity math.
              </p>

              {/* CTA Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/claims"
                  className="btn-pill-primary font-mono text-sm"
                >
                  <span>Explore Docket</span>
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>

                <Link
                  href="/policies/create"
                  className="btn-pill-dark font-mono text-sm"
                >
                  <PlusIcon className="h-4 w-4 text-[#9ea3b2]" />
                  <span>Underwrite Risk Pool</span>
                </Link>

                <Link
                  href="/protocol"
                  className="btn-ghost font-mono text-sm"
                >
                  Protocol Guide &rarr;
                </Link>
              </div>

              {isFallback && (
                <div className="pt-2 text-xs text-[#a4a8b7] flex items-center gap-2 font-mono">
                  <span className="h-2 w-2 rounded-full bg-[#f0f2f5] animate-pulse" />
                  Live contract synchronized with Studionet (Chain ID 61999).
                </div>
              )}
            </div>

            {/* Right Interactive 3D Particle Constellation */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              <div className="relative w-full aspect-square max-w-[650px]">
                <HeroConstellation />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Protocol Metrics Proof Bar */}
      <section className="mx-auto max-w-[1536px] px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="linear-card p-6">
            <div className="text-xs uppercase font-mono tracking-wider text-[#8a8f9c]">
              Total Policy Pools
            </div>
            <div className="mt-2 text-3xl sm:text-4xl font-extrabold text-white font-mono">
              {totals.policyCount || policies.length}
            </div>
            <div className="text-xs text-[#8a8f9c] mt-1.5">Active risk facilities</div>
          </div>

          <div className="linear-card p-6">
            <div className="text-xs uppercase font-mono tracking-wider text-[#8a8f9c]">
              Claims Adjudicated
            </div>
            <div className="mt-2 text-3xl sm:text-4xl font-extrabold text-white font-mono">
              {totals.claimCount || claims.length}
            </div>
            <div className="text-xs text-[#8a8f9c] mt-1.5">Property damage filings</div>
          </div>

          <div className="linear-card p-6">
            <div className="text-xs uppercase font-mono tracking-wider text-[#8a8f9c]">
              Consensus Verdicts
            </div>
            <div className="mt-2 text-3xl sm:text-4xl font-extrabold text-[#f0f2f5] font-mono">
              {totals.verdictCount || 1}
            </div>
            <div className="text-xs text-[#8a8f9c] mt-1.5">Equivalence principle rulings</div>
          </div>

          <div className="linear-card p-6">
            <div className="text-xs uppercase font-mono tracking-wider text-[#8a8f9c]">
              Indemnity Precision
            </div>
            <div className="mt-2 text-3xl sm:text-4xl font-extrabold text-white font-mono">
              10,000 BPS
            </div>
            <div className="text-xs text-[#8a8f9c] mt-1.5">Continuous 0.01% resolution</div>
          </div>
        </div>
      </section>

      {/* Live Property Damage Claims Docket Section */}
      <section className="mx-auto max-w-[1536px] px-5 sm:px-8 lg:px-12 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-[#22242c]">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3 font-mono">
              <GavelIcon className="h-7 w-7 text-white" />
              Property Damage Court Docket
            </h2>
            <p className="text-sm sm:text-base text-[#8a8f9c] mt-1">
              Live claims undergoing underwriter review, defense rebuttal, or AI Magistrate consensus adjudication.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            {[
              { id: "all", label: "All Claims" },
              { id: "active", label: "Active Window" },
              { id: "resolved", label: "Settled" },
              { id: "slashed", label: "Fraud Slashed" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setClaimFilter(tab.id)}
                className={`px-4 py-2 rounded-full border transition-all text-xs font-semibold ${
                  claimFilter === tab.id
                    ? "border-[#484c59] bg-[#1e2027] text-white"
                    : "border-[#22242c] bg-[#0c0d10] text-[#8a8f9c] hover:text-white hover:bg-[#141519]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filteredClaims.length === 0 ? (
          <div className="rounded-2xl border border-[#22242c] bg-[#0c0d10] p-16 text-center text-[#8a8f9c] font-mono text-sm">
            No claims found under filter &quot;{claimFilter}&quot;.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClaims.map((claim) => (
              <ClaimCard
                key={claim.id}
                claim={claim}
                onInspect={(c) => setSelectedClaimForDetail(c)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Featured Underwritten Risk Pools Section */}
      <section className="mx-auto max-w-[1536px] px-5 sm:px-8 lg:px-12 space-y-6 pt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-[#22242c]">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3 font-mono">
              <ShieldCheckIcon className="h-7 w-7 text-white" />
              Underwritten Risk Pools
            </h2>
            <p className="text-sm sm:text-base text-[#8a8f9c] mt-1">
              Pre-funded indemnity pools backing property risks with transparent coverage terms.
            </p>
          </div>

          <div className="flex items-center gap-4 text-sm font-mono">
            <Link
              href="/policies/create"
              className="inline-flex items-center gap-1.5 text-white hover:underline font-semibold"
            >
              <PlusIcon className="h-4 w-4" />
              Create Risk Pool
            </Link>
            <span className="text-[#333640]">&middot;</span>
            <Link
              href="/policies"
              className="text-[#8a8f9c] hover:text-white"
            >
              View all pools &rarr;
            </Link>
          </div>
        </div>

        {policies.length === 0 ? (
          <div className="rounded-2xl border border-[#22242c] bg-[#0c0d10] p-16 text-center text-[#8a8f9c] font-mono text-sm">
            No active policy pools found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {policies.slice(0, 6).map((policy) => (
              <PolicyCard
                key={policy.id}
                policy={policy}
                onFileClaim={handleOpenFileClaim}
                onViewTerms={(p) => setSelectedPolicyForDetail(p)}
                onInspect={(p) => setSelectedPolicyForDetail(p)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Expanded Card Modals */}
      <ClaimDetailModal
        claim={selectedClaimForDetail}
        onClose={() => setSelectedClaimForDetail(null)}
      />

      <PolicyDetailModal
        policy={selectedPolicyForDetail}
        onClose={() => setSelectedPolicyForDetail(null)}
        onFileClaim={handleOpenFileClaim}
      />

      {/* Action Modals */}
      <CreatePolicyModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => loadData()}
      />

      {selectedPolicyForClaim && (
        <FileClaimModal
          policy={selectedPolicyForClaim}
          isOpen={isFileClaimOpen}
          onClose={() => {
            setIsFileClaimOpen(false);
            setSelectedPolicyForClaim(null);
          }}
          onSuccess={() => loadData()}
        />
      )}
    </div>
  );
}
