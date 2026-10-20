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
    <div className="space-y-14 pb-16">
      {/* Hero Section matching Dala Reference with Interactive 3D Constellation */}
      <section className="relative overflow-hidden border-b border-[#23252a] bg-[#000000] pt-8 pb-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Headline & Narrative Column */}
            <div className="lg:col-span-7 space-y-6 text-left z-10">
              {/* Amber Category Pill Tag */}
              <div className="inline-flex items-center gap-2 rounded-full border border-[#ffb829]/30 bg-[#ffb829]/10 px-3.5 py-1 text-xs font-mono text-[#ffb829]">
                <SparklesIcon className="h-3.5 w-3.5" />
                <span>GENLAYER STUDIONET 61999 &middot; DAMAGE COURT</span>
              </div>

              {/* Oversized High-Contrast Headline */}
              <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-[1.05]">
                Where Ambiguous Damage Meets On-Chain Consensus.
              </h1>

              {/* Clear Precision Narrative */}
              <p className="text-base sm:text-lg text-[#8a8f98] leading-relaxed max-w-2xl">
                Beyond binary parametric triggers. DamageAssessCourt settles catastrophic property claims by
                cross-examining physical site photography, weather radar feeds, and ambiguous policy exclusion
                clauses through multi-validator AI consensus and continuous 0 to 10,000 Basis Points indemnity math.
              </p>

              {/* CTA Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/claims"
                  className="btn-pill-gold font-mono"
                >
                  <span>Explore Docket</span>
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>

                <Link
                  href="/policies/create"
                  className="btn-pill-primary font-mono"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>Underwrite Risk Pool</span>
                </Link>

                <Link
                  href="/protocol"
                  className="btn-ghost font-mono text-xs"
                >
                  Protocol Guide &rarr;
                </Link>
              </div>

              {isFallback && (
                <div className="pt-2 text-xs text-[#ffb829] flex items-center gap-2 font-mono">
                  <span className="h-2 w-2 rounded-full bg-[#ffb829] animate-pulse" />
                  Live contract synchronized with Studionet (Chain ID 61999).
                </div>
              )}
            </div>

            {/* Right Interactive 3D Particle Constellation */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              <div className="relative w-full aspect-square max-w-[500px]">
                <HeroConstellation />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Protocol Metrics Proof Bar */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="linear-card p-5">
            <div className="text-[10px] uppercase font-mono tracking-wider text-[#8a8f98]">
              Total Policy Pools
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {totals.policyCount || policies.length}
            </div>
            <div className="text-[11px] text-[#8a8f98] mt-1">Active risk facilities</div>
          </div>

          <div className="linear-card p-5">
            <div className="text-[10px] uppercase font-mono tracking-wider text-[#8a8f98]">
              Claims Adjudicated
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {totals.claimCount || claims.length}
            </div>
            <div className="text-[11px] text-[#8a8f98] mt-1">Property damage filings</div>
          </div>

          <div className="linear-card p-5">
            <div className="text-[10px] uppercase font-mono tracking-wider text-[#8a8f98]">
              Consensus Verdicts
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#ffb829] font-mono">
              {totals.verdictCount || 1}
            </div>
            <div className="text-[11px] text-[#8a8f98] mt-1">Equivalence principle rulings</div>
          </div>

          <div className="linear-card p-5">
            <div className="text-[10px] uppercase font-mono tracking-wider text-[#8a8f98]">
              Indemnity Precision
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
              10,000 BPS
            </div>
            <div className="text-[11px] text-[#8a8f98] mt-1">Continuous 0.01% resolution</div>
          </div>
        </div>
      </section>

      {/* Live Property Damage Claims Docket Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[#23252a]">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5 font-mono">
              <GavelIcon className="h-6 w-6 text-[#ffb829]" />
              Property Damage Court Docket
            </h2>
            <p className="text-xs sm:text-sm text-[#8a8f98] mt-0.5">
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
                className={`px-3 py-1.5 rounded-full border transition-all ${
                  claimFilter === tab.id
                    ? "border-[#ffb829] bg-[#ffb829]/10 text-[#ffb829] font-bold"
                    : "border-[#23252a] bg-[#0c0d0e] text-[#8a8f98] hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filteredClaims.length === 0 ? (
          <div className="rounded-2xl border border-[#23252a] bg-[#0c0d0e] p-12 text-center text-[#8a8f98] font-mono text-sm">
            No claims found under filter &quot;{claimFilter}&quot;.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-5 pt-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[#23252a]">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5 font-mono">
              <ShieldCheckIcon className="h-6 w-6 text-emerald-400" />
              Underwritten Policy Pools
            </h2>
            <p className="text-xs sm:text-sm text-[#8a8f98] mt-0.5">
              Pre-funded indemnity pools backing property risks with transparent coverage terms.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/policies/create"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-[#ffb829] hover:underline"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Create Risk Pool
            </Link>
            <span className="text-[#383b3f]">&middot;</span>
            <Link
              href="/policies"
              className="text-xs font-mono text-[#8a8f98] hover:text-white"
            >
              View all pools &rarr;
            </Link>
          </div>
        </div>

        {policies.length === 0 ? (
          <div className="rounded-2xl border border-[#23252a] bg-[#0c0d0e] p-12 text-center text-[#8a8f98] font-mono text-sm">
            No active policy pools found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {policies.slice(0, 4).map((policy) => (
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
