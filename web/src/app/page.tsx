"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Claim, PolicyPool } from "@/types/damageassesscourt";
import { fetchAllPolicies, fetchTotals, DEMO_CLAIMS } from "@/lib/genlayer";
import { PolicyCard } from "@/components/policy-card";
import { ClaimCard } from "@/components/claim-card";
import { CreatePolicyModal } from "@/components/create-policy-modal";
import { FileClaimModal } from "@/components/file-claim-modal";
import {
  GavelIcon,
  ShieldCheckIcon,
  SparklesIcon,
  BuildingOfficeIcon,
  PlusIcon,
} from "@/components/icons";

export default function DashboardPage() {
  const [policies, setPolicies] = useState<PolicyPool[]>([]);
  const [claims, setClaims] = useState<Claim[]>(DEMO_CLAIMS);
  const [totals, setTotals] = useState({ policyCount: 0, claimCount: 0, verdictCount: 0 });
  const [loading, setLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isFileClaimOpen, setIsFileClaimOpen] = useState(false);
  const [selectedPolicyForClaim, setSelectedPolicyForClaim] = useState<PolicyPool | null>(null);
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
    <div className="space-y-10">
      {/* Hero Section */}
      <div className="relative rounded-3xl border border-court-amber/30 bg-gradient-to-br from-court-midnight via-slate-900 to-slate-950 p-8 sm:p-12 overflow-hidden shadow-2xl">
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-court-amber/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-court-amber/40 bg-court-amber/10 text-xs font-mono text-amber-300">
            <SparklesIcon className="h-3.5 w-3.5" />
            <span>GenLayer Equivalence Principle Powered Court</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white font-serif">
            Complex Property Damage <br />
            <span className="text-court-amber">Adjudication Court</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            Beyond binary parametric triggers. DamageAssessCourt settles catastrophic storm and water ingress
            claims by cross-examining contractor estimates, ambiguous policy exclusions, and official NOAA logs
            through multi-validator AI consensus and continuous 0 to 10,000 Basis Points indemnity math.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-court-amber hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-950/40 transition-all font-mono"
            >
              <PlusIcon className="h-4 w-4" />
              Underwrite Policy Pool
            </button>
            <Link
              href="/policies"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-700 hover:border-slate-500 bg-slate-900/60 hover:bg-slate-800 text-slate-200 font-semibold text-sm transition-all font-mono"
            >
              <BuildingOfficeIcon className="h-4 w-4" />
              Browse Risk Pools
            </Link>
            <Link
              href="/protocol"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-transparent hover:border-slate-800 text-slate-400 hover:text-slate-200 text-sm transition-all font-mono"
            >
              Protocol Specs &rarr;
            </Link>
          </div>
        </div>

        {isFallback && (
          <div className="mt-8 pt-4 border-t border-slate-800/80 text-xs text-amber-400/90 flex items-center gap-2 font-mono">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
            Showing preview demonstration data. Connect to live contract on GenLayer Studionet anytime.
          </div>
        )}
      </div>

      {/* Protocol Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="text-xs uppercase font-mono text-slate-400">Total Policy Pools</div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-white font-mono">
            {totals.policyCount || policies.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Commercial indemnity facilities</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="text-xs uppercase font-mono text-slate-400">Claims Adjudicated</div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-white font-mono">
            {totals.claimCount || claims.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Total property damage filings</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="text-xs uppercase font-mono text-slate-400">Consensus Verdicts</div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-court-amber font-mono">
            {totals.verdictCount || 1}
          </div>
          <div className="text-xs text-slate-500 mt-1">Equivalence Principle rulings</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="text-xs uppercase font-mono text-slate-400">Indemnity Precision</div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
            10,000 BPS
          </div>
          <div className="text-xs text-slate-500 mt-1">Continuous 0.01% resolution</div>
        </div>
      </div>

      {/* Active Property Damage Claims Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 font-mono">
              <GavelIcon className="h-6 w-6 text-court-amber" />
              Property Damage Court Docket
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Live claims undergoing underwriter review, defense rebuttal, or AI Magistrate consensus adjudication.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            {[
              { id: "all", label: "All Claims" },
              { id: "active", label: "Active Disputes" },
              { id: "resolved", label: "Resolved" },
              { id: "slashed", label: "Fraud Slashed" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setClaimFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg border transition-all ${
                  claimFilter === tab.id
                    ? "border-court-amber bg-court-amber/10 text-court-amber font-bold"
                    : "border-slate-800 bg-slate-900/50 text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filteredClaims.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-12 text-center text-slate-500 font-mono text-sm">
            No claims found under filter &quot;{claimFilter}&quot;.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredClaims.map((claim) => (
              <ClaimCard key={claim.id} claim={claim} />
            ))}
          </div>
        )}
      </div>

      {/* Featured Underwritten Risk Pools */}
      <div className="space-y-4 pt-6 border-t border-slate-800/80">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 font-mono">
              <ShieldCheckIcon className="h-6 w-6 text-emerald-400" />
              Underwritten Policy Pools
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Pre-funded indemnity pools backing property risks with transparent coverage terms.
            </p>
          </div>

          <Link
            href="/policies"
            className="text-xs font-mono text-court-amber hover:underline flex items-center gap-1"
          >
            View all pools &rarr;
          </Link>
        </div>

        {policies.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-12 text-center text-slate-500 font-mono text-sm">
            No active policy pools found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {policies.slice(0, 4).map((policy) => (
              <PolicyCard
                key={policy.id}
                policy={policy}
                onFileClaim={handleOpenFileClaim}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
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
