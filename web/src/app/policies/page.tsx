"use client";

import React, { useEffect, useState } from "react";
import { PolicyPool } from "@/types/damageassesscourt";
import { fetchAllPolicies } from "@/lib/genlayer";
import { PolicyCard } from "@/components/policy-card";
import { CreatePolicyModal } from "@/components/create-policy-modal";
import { FileClaimModal } from "@/components/file-claim-modal";
import { BuildingOfficeIcon, PlusIcon, SparklesIcon } from "@/components/icons";

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<PolicyPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isFileClaimOpen, setIsFileClaimOpen] = useState(false);
  const [selectedPolicyForClaim, setSelectedPolicyForClaim] = useState<PolicyPool | null>(null);

  async function loadPolicies() {
    setLoading(true);
    try {
      const res = await fetchAllPolicies(0, 50);
      setPolicies(res.policies);
    } catch (err) {
      console.error("Failed fetching policies:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPolicies();
  }, []);

  function handleFileClaim(policy: PolicyPool) {
    setSelectedPolicyForClaim(policy);
    setIsFileClaimOpen(true);
  }

  const filteredPolicies = policies.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.policy_terms.toLowerCase().includes(q) ||
      p.underwriter.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-950/20 text-xs font-mono text-emerald-300 mb-2">
            <BuildingOfficeIcon className="h-3.5 w-3.5" />
            <span>Commercial Risk Facilities</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-serif">
            Underwritten Policy Pools
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Explore active insurance pools, examine verified peril definitions, review coverage caps, and file property damage claims.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-court-amber hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-950/30 transition-all font-mono"
        >
          <PlusIcon className="h-4 w-4" />
          Underwrite New Pool
        </button>
      </div>

      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-96">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search policies by peril, terms, or underwriter..."
            className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-court-amber focus:outline-none font-mono"
          />
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Showing <span className="text-white font-bold">{filteredPolicies.length}</span> active pools
        </div>
      </div>

      {/* Policies Grid */}
      {loading ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-16 text-center text-slate-400 font-mono text-sm">
          Loading risk pools from GenLayer Studionet...
        </div>
      ) : filteredPolicies.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-16 text-center text-slate-500 font-mono text-sm">
          No policy pools matching query &quot;{searchQuery}&quot;.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPolicies.map((policy) => (
            <PolicyCard
              key={policy.id}
              policy={policy}
              onFileClaim={handleFileClaim}
            />
          ))}
        </div>
      )}

      {/* Protocol Architecture Note */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-2 text-xs text-slate-400">
        <div className="font-semibold text-slate-200 flex items-center gap-2 font-mono">
          <SparklesIcon className="h-4 w-4 text-court-amber" />
          How Policy Escrow Pools Work in DamageAssessCourt
        </div>
        <p className="leading-relaxed">
          Each policy pool is fully capitalized by its underwriter in native escrow. When a property owner files a claim, the requested amount is immediately sequestered from active capacity to guarantee solvency. If contested, GenLayer AI validators evaluate the specific exclusions against external invoices and weather telemetry. Full or partial settlements disburse automatically without custody intermediaries.
        </p>
      </div>

      {/* Modals */}
      <CreatePolicyModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => loadPolicies()}
      />

      {selectedPolicyForClaim && (
        <FileClaimModal
          policy={selectedPolicyForClaim}
          isOpen={isFileClaimOpen}
          onClose={() => {
            setIsFileClaimOpen(false);
            setSelectedPolicyForClaim(null);
          }}
          onSuccess={() => loadPolicies()}
        />
      )}
    </div>
  );
}
