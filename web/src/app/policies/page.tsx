"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PolicyPool } from "@/types/damageassesscourt";
import { fetchAllPolicies } from "@/lib/genlayer";
import { PolicyCard } from "@/components/policy-card";
import { PolicyDetailModal } from "@/components/policy-detail-modal";
import { CreatePolicyModal } from "@/components/create-policy-modal";
import { FileClaimModal } from "@/components/file-claim-modal";
import { ShieldCheckIcon, PlusIcon, ArrowRightIcon } from "@/components/icons";

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<PolicyPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isFileClaimOpen, setIsFileClaimOpen] = useState(false);
  const [selectedPolicyForClaim, setSelectedPolicyForClaim] = useState<PolicyPool | null>(null);
  const [selectedPolicyForDetail, setSelectedPolicyForDetail] = useState<PolicyPool | null>(null);

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
    const terms = p.policy_terms_text || "";
    return (
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      terms.toLowerCase().includes(q) ||
      p.underwriter.toLowerCase().includes(q)
    );
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#23252a] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono text-emerald-400 mb-2">
            <ShieldCheckIcon className="h-3.5 w-3.5" />
            <span>COMMERCIAL RISK UNDERWRITING</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-mono">
            Underwritten Risk Pools
          </h1>
          <p className="mt-1 text-sm text-[#8a8f98] max-w-2xl">
            Explore active insurance facilities, examine verified peril definitions, review coverage caps,
            and inspect verbatim policy exclusion terms.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <Link
            href="/policies/create"
            className="btn-pill-gold font-mono"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Underwrite New Pool</span>
          </Link>
        </div>
      </div>

      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-96">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search policies by peril, terms, or underwriter..."
            className="w-full rounded-full border border-[#23252a] bg-[#0c0d0e] px-4 py-2 text-xs text-white placeholder-[#62666d] focus:border-[#ffb829] focus:outline-none font-mono"
          />
        </div>

        <div className="text-xs text-[#8a8f98] font-mono">
          Showing <span className="text-white font-bold">{filteredPolicies.length}</span> active pools
        </div>
      </div>

      {/* Policies Grid */}
      {loading ? (
        <div className="linear-card p-16 text-center text-[#8a8f98] font-mono text-sm">
          Loading risk pools from GenLayer Studionet...
        </div>
      ) : filteredPolicies.length === 0 ? (
        <div className="linear-card p-16 text-center text-[#8a8f98] font-mono text-sm space-y-3">
          <p>No policy pools matching query &quot;{searchQuery}&quot;.</p>
          <button
            onClick={() => setSearchQuery("")}
            className="text-xs text-[#ffb829] underline underline-offset-4"
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPolicies.map((policy) => (
            <PolicyCard
              key={policy.id}
              policy={policy}
              onFileClaim={handleFileClaim}
              onViewTerms={(p) => setSelectedPolicyForDetail(p)}
              onInspect={(p) => setSelectedPolicyForDetail(p)}
            />
          ))}
        </div>
      )}

      {/* Policy Details Modal */}
      <PolicyDetailModal
        policy={selectedPolicyForDetail}
        onClose={() => setSelectedPolicyForDetail(null)}
        onFileClaim={handleFileClaim}
      />

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
