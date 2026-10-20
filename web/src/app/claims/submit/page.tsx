"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useWallet } from "@/lib/use-wallet";
import { fetchAllPolicies, fileClaim } from "@/lib/genlayer";
import { PolicyPool } from "@/types/damageassesscourt";
import { TransactionLifecycle, TxState } from "@/components/transaction-lifecycle";
import { parseGenToWei, formatWei } from "@/lib/safety";
import { GavelIcon } from "@/components/icons";

function SubmitClaimContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const policyParam = searchParams.get("policyId");

  const { isConnected, connect, assertStudionet } = useWallet();

  const [policies, setPolicies] = useState<PolicyPool[]>([]);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>(policyParam || "");
  const [damageTitle, setDamageTitle] = useState("");
  const [damageDesc, setDamageDesc] = useState("");
  const [claimedAmount, setClaimedAmount] = useState("50");
  const [evidencePhoto, setEvidencePhoto] = useState("https://ipfs.io/ipfs/bafybeidamagephotoexample123");
  const [evidenceRadar, setEvidenceRadar] = useState("https://noaa.gov/reports/storm-front-fl-2026.pdf");
  const [evidencePolice, setEvidencePolice] = useState("https://miamidade.gov/dispatch/incident-884920.json");

  const [txState, setTxState] = useState<TxState>("idle");
  const [txHash, setTxHash] = useState<string | undefined>(undefined);
  const [txError, setTxError] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetchAllPolicies(0, 50).then((res) => {
      setPolicies(res.policies);
      if (!selectedPolicyId && res.policies.length > 0) {
        setSelectedPolicyId(res.policies[0].id.toString());
      }
    });
  }, [selectedPolicyId]);

  const activePolicy = policies.find((p) => p.id.toString() === selectedPolicyId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      const ok = await connect();
      if (!ok) return;
    }

    const onRightNet = await assertStudionet();
    if (!onRightNet) return;

    if (!activePolicy) {
      alert("Please select a valid policy pool.");
      return;
    }

    if (!damageTitle.trim() || !damageDesc.trim()) {
      alert("Please provide both a title and description.");
      return;
    }

    const claimWei = parseGenToWei(claimedAmount);
    const stakeWei = BigInt(activePolicy.min_claimant_stake.toString());

    if (claimWei <= BigInt(0)) {
      alert("Claimed amount must be greater than zero.");
      return;
    }

    const evidenceUrls = [evidencePhoto, evidenceRadar, evidencePolice].filter((url) =>
      Boolean(url && url.trim())
    );

    try {
      setTxState("signing");
      setTxError(undefined);

      const res = await fileClaim(
        activePolicy.id,
        damageTitle,
        damageDesc,
        claimWei,
        stakeWei,
        evidenceUrls,
        (status) => {
          if (status === "signing") setTxState("signing");
          if (status === "broadcasting") setTxState("broadcasting");
          if (status === "waiting") setTxState("waiting");
        }
      );

      if (res.success) {
        setTxHash(res.txHash);
        setTxState("confirmed");
      } else {
        setTxError(res.error || "Failed to file claim.");
        setTxState("error");
      }
    } catch (err: unknown) {
      console.error("Filing claim error:", err);
      const msg = err instanceof Error ? err.message : "Filing failed";
      setTxError(msg);
      setTxState("error");
    }
  };

  return (
    <div className="mx-auto max-w-[1536px] w-full px-5 sm:px-8 lg:px-12 py-10 space-y-10">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm font-mono text-[#8a8f9c]">
        <Link href="/claims" className="hover:text-white transition-colors">
          &larr; Claims Docket
        </Link>
        <span>/</span>
        <span className="text-white">File New Damage Claim</span>
      </div>

      {/* Header */}
      <div className="border-b border-[#22242c] pb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#2a2d36] bg-[#121317] px-4 py-1.5 text-xs font-mono text-[#d8dbe4] mb-3">
          <GavelIcon className="h-4 w-4 text-[#a4a8b7]" />
          <span>OFFICIAL CLAIM DOSSIER FILING</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white font-mono">
          File Property Damage Claim
        </h1>
        <p className="mt-2 text-base text-[#9ea3b2] leading-relaxed max-w-3xl">
          Submit verifiable evidence of catastrophic structural or water ingress damage. GenLayer
          AI validators inspect images, weather records, and policy language to formulate continuous basis-point settlements.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Target Pool & Narrative */}
          <div className="space-y-8">
            {/* Select Target Pool */}
            <div className="linear-card p-6 sm:p-8 space-y-5">
              <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2.5">
                <span className="text-[#8a8f9c]">01.</span> Select Policy Risk Pool
              </h2>

              <div>
                <label className="block text-xs font-mono text-[#8a8f9c] uppercase tracking-wider mb-2">
                  Target Indemnity Pool *
                </label>
                <select
                  value={selectedPolicyId}
                  onChange={(e) => setSelectedPolicyId(e.target.value)}
                  className="w-full rounded-xl border border-[#22242c] bg-[#141519] px-4 py-3 text-sm sm:text-base text-white focus:border-[#424554] focus:outline-none font-mono"
                >
                  {policies.map((p) => (
                    <option key={p.id} value={p.id}>
                      Pool #{p.id}: {p.title} ({formatWei(p.total_escrow_pool)} GEN Escrow)
                    </option>
                  ))}
                </select>
              </div>

              {activePolicy && (
                <div className="rounded-xl bg-[#090a0d] p-4 border border-[#22242c] text-xs grid sm:grid-cols-3 gap-3 font-mono">
                  <div>
                    <span className="text-[#8a8f9c] block">Max Claim Cap:</span>
                    <span className="text-white font-bold">{formatWei(activePolicy.max_claim_cap)} GEN</span>
                  </div>
                  <div>
                    <span className="text-[#8a8f9c] block">Required Stake:</span>
                    <span className="text-white font-bold">
                      {formatWei(activePolicy.min_claimant_stake)} GEN
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8a8f9c] block">Deductible:</span>
                    <span className="text-emerald-400 font-bold">{activePolicy.deductible_bps ?? 500} bps</span>
                  </div>
                </div>
              )}
            </div>

            {/* Damage Narrative */}
            <div className="linear-card p-6 sm:p-8 space-y-5">
              <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2.5">
                <span className="text-[#8a8f9c]">02.</span> Damage Narrative &amp; Loss Evaluation
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-[#8a8f9c] uppercase tracking-wider mb-2">
                    Incident Summary Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Roof Membrane Rupture & Commercial Inventory Water Damage"
                    value={damageTitle}
                    onChange={(e) => setDamageTitle(e.target.value)}
                    className="w-full rounded-xl border border-[#22242c] bg-[#141519] px-4 py-3 text-base text-white focus:border-[#424554] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#8a8f9c] uppercase tracking-wider mb-2">
                    Detailed Incident Narrative *
                  </label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Explain the sequence of events, timestamp of failure, physical manifestation of damage, and affected equipment/structures..."
                    value={damageDesc}
                    onChange={(e) => setDamageDesc(e.target.value)}
                    className="w-full rounded-xl border border-[#22242c] bg-[#141519] px-4 py-3 text-base text-white focus:border-[#424554] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#8a8f9c] uppercase tracking-wider mb-2">
                    Total Indemnity Amount Claimed (GEN) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    required
                    value={claimedAmount}
                    onChange={(e) => setClaimedAmount(e.target.value)}
                    className="w-full rounded-xl border border-[#22242c] bg-[#141519] px-4 py-3 font-mono text-base text-white focus:border-[#424554] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Evidence Dossier Links */}
          <div className="space-y-8">
            <div className="linear-card p-6 sm:p-8 space-y-6">
              <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2.5">
                <span className="text-[#8a8f9c]">03.</span> Multi-Source Evidence Dossier
              </h2>

              <p className="text-sm text-[#9ea3b2]">
                GenLayer validators inspect untrusted external evidence to verify physical damage against the policy
                wording. Please provide public HTTP or IPFS URLs for photographs, storm radar records, and dispatch logs.
              </p>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-mono text-[#8a8f9c] uppercase tracking-wider mb-2">
                    Site Damage Photograph URL (IPFS or HTTPS) *
                  </label>
                  <input
                    type="url"
                    required
                    value={evidencePhoto}
                    onChange={(e) => setEvidencePhoto(e.target.value)}
                    className="w-full rounded-xl border border-[#22242c] bg-[#141519] px-4 py-3 font-mono text-xs text-white focus:border-[#424554] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#8a8f9c] uppercase tracking-wider mb-2">
                    Weather Doppler Radar / NOAA Log URL
                  </label>
                  <input
                    type="url"
                    value={evidenceRadar}
                    onChange={(e) => setEvidenceRadar(e.target.value)}
                    className="w-full rounded-xl border border-[#22242c] bg-[#141519] px-4 py-3 font-mono text-xs text-white focus:border-[#424554] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#8a8f9c] uppercase tracking-wider mb-2">
                    Emergency Dispatch / Police Report URL
                  </label>
                  <input
                    type="url"
                    value={evidencePolice}
                    onChange={(e) => setEvidencePolice(e.target.value)}
                    className="w-full rounded-xl border border-[#22242c] bg-[#141519] px-4 py-3 font-mono text-xs text-white focus:border-[#424554] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submission Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-[#22242c]">
          <Link
            href="/claims"
            className="text-sm font-mono text-[#8a8f9c] hover:text-white transition-colors"
          >
            Cancel &amp; Return to Docket
          </Link>

          <button
            type="submit"
            disabled={txState === "signing" || txState === "broadcasting" || txState === "waiting"}
            className="btn-pill-primary font-mono w-full sm:w-auto"
          >
            <GavelIcon className="h-5 w-5" />
            <span>Submit Claim &amp; Post Anti-Spam Stake</span>
          </button>
        </div>
      </form>

      {/* Transaction Modal */}
      <TransactionLifecycle
        isOpen={txState !== "idle"}
        state={txState}
        txHash={txHash}
        errorMessage={txError}
        title="Submitting Property Damage Claim"
        actionLabel="Registering Evidence Dossier on GenLayer"
        onClose={() => {
          setTxState("idle");
          if (txState === "confirmed") {
            router.push("/claims");
          }
        }}
        onConfirmedAction={() => router.push("/claims")}
      />
    </div>
  );
}

export default function SubmitClaimPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[1536px] w-full px-5 py-20 text-center font-mono text-sm text-[#8a8f9c]">
          Loading claim filing dossier...
        </div>
      }
    >
      <SubmitClaimContent />
    </Suspense>
  );
}
