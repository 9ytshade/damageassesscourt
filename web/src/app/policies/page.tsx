"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PolicyPool } from "@/types/damageassesscourt";
import { fetchAllPolicies } from "@/lib/genlayer";
import { PolicyCard } from "@/components/policy-card";
import { PolicyDetailModal } from "@/components/policy-detail-modal";
import { ShieldCheckIcon, PlusIcon } from "@/components/icons";

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<PolicyPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadPolicies();
  }, []);

  const filteredPolicies = policies.filter((p) => {
    const q = searchQuery.toLowerCase();
    const terms = p.policy_terms_text || p.policy_terms || "";
    return (
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      terms.toLowerCase().includes(q) ||
      p.underwriter.toLowerCase().includes(q)
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
                <ShieldCheckIcon className="h-4 w-4 text-[#a4a8b7]" />
                <span>COMMERCIAL RISK UNDERWRITING</span>
              </div>
              <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white font-mono">
                Risk Pools
              </h1>
              <p className="text-base sm:text-lg text-[#9ea3b2] max-w-3xl leading-relaxed">
                Explore active insurance facilities, examine verified peril definitions, review coverage caps,
                and inspect verbatim policy exclusion terms backed by autonomous GenLayer contract escrow.
              </p>
            </div>

            <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
              <Link
                href="/policies/create"
                className="btn-pill-primary font-mono text-sm"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Underwrite New Pool</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area matching 1536px grid */}
      <div className="mx-auto max-w-[1536px] w-full px-5 sm:px-8 lg:px-12 space-y-8">
        {/* Search & Stats Bar spanning full width */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-2 rounded-2xl border border-[#22242c] bg-[#101115]">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search policies by peril, terms, or underwriter address..."
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

          <div className="px-4 py-2 text-sm text-[#8a8f9c] font-mono shrink-0">
            Showing <span className="text-white font-bold">{filteredPolicies.length}</span> active pools
          </div>
        </div>

        {/* Policies Grid matching full wide layout */}
        {loading ? (
          <div className="rounded-3xl border border-[#22242c] bg-[#141519]/70 p-16 text-center text-[#8a8f9c] font-mono text-sm animate-pulse">
            Loading underwritten risk pools from GenLayer Studionet...
          </div>
        ) : filteredPolicies.length === 0 ? (
          <div className="rounded-3xl border border-[#22242c] bg-[#141519]/70 p-16 text-center text-[#8a8f9c] font-mono text-sm space-y-3">
            <p>No insurance pools match your search query.</p>
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs text-white underline underline-offset-4"
            >
              Reset Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPolicies.map((policy) => (
              <PolicyCard
                key={policy.id}
                policy={policy}
                onInspect={(p) => setSelectedPolicyForDetail(p)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Expanded Modal */}
      <PolicyDetailModal
        policy={selectedPolicyForDetail}
        onClose={() => setSelectedPolicyForDetail(null)}
      />
    </div>
  );
}
