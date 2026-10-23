"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useWallet } from "@/lib/use-wallet";
import { fetchAllPolicies, fileClaim } from "@/lib/genlayer";
import { PolicyPool } from "@/types/damageassesscourt";
import { TransactionLifecycle, TxState } from "@/components/transaction-lifecycle";
import { parseGenToWei, formatWei } from "@/lib/safety";
import { GavelIcon } from "@/components/icons";

function SubmitClaimForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPolicyId = searchParams.get("policy");

  const { isConnected, connect, assertStudionet } = useWallet();

  const [policies, setPolicies] = useState<PolicyPool[]>([]);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>(preselectedPolicyId || "1");
  const [damageTitle, setDamageTitle] = useState("");
  const [damageDescription, setDamageDescription] = useState("");
  const [claimedAmount, setClaimedAmount] = useState("10");
  const [evidenceUrl1, setEvidenceUrl1] = useState("");
  const [evidenceUrl2, setEvidenceUrl2] = useState("");
  const [evidenceHash, setEvidenceHash] = useState("");

  const [txState, setTxState] = useState<TxState>("idle");
  const [txHash, setTxHash] = useState<string | undefined>(undefined);
  const [txError, setTxError] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetchAllPolicies().then((res) => {
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

    if (!damageTitle.trim() || !damageDescription.trim() || !evidenceUrl1.trim()) {
      alert("Please fill in the title, description, and at least one primary evidence URL.");
      return;
    }

    const claimWei = parseGenToWei(claimedAmount);
    if (claimWei <= BigInt(0)) {
      alert("Claimed indemnity must be greater than zero.");
      return;
    }

    const evidenceUrls = [evidenceUrl1.trim()];
    if (evidenceUrl2.trim()) evidenceUrls.push(evidenceUrl2.trim());

    try {
      setTxState("signing");
      setTxError(undefined);

      const stakeWei = activePolicy
        ? BigInt(activePolicy.min_claimant_stake.toString())
        : parseGenToWei("10");

      const res = await fileClaim(
        parseInt(selectedPolicyId, 10),
        damageTitle,
        damageDescription,
        claimWei,
        stakeWei,
        evidenceUrls,
        (status, hash) => {
          if (status === "broadcasting") {
            setTxState("broadcasting");
            if (hash) setTxHash(hash);
          } else if (status === "waiting") {
            setTxState("waiting");
          }
        }
      );

      if (res.success) {
        if (res.txHash) setTxHash(res.txHash);
        setTxState("confirmed");
      } else {
        setTxError(res.error || "Failed to submit claim.");
        setTxState("error");
      }
    } catch (err: unknown) {
      console.error("Claim submission error:", err);
      const msg = err instanceof Error ? err.message : "Transaction failed";
      setTxError(msg);
      setTxState("error");
    }
  };

  return (
    <div className="w-full pb-20 space-y-10 animate-fade-in">
      {/* Full-Width Top Header Banner matching Landing Page */}
      <section className="relative w-full border-b border-[#22242c] bg-[#000000] py-12 lg:py-16">
        <div className="mx-auto max-w-[1536px] w-full px-5 sm:px-8 lg:px-12 space-y-4">
          <div className="flex items-center gap-2 text-sm font-mono text-[#8a8f9c]">
            <Link href="/claims" className="hover:text-white transition-colors">
              &larr; Claims Docket
            </Link>
            <span>/</span>
            <span className="text-white">File Property Damage Claim</span>
          </div>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#2a2d36] bg-[#121317] px-4 py-1.5 text-xs font-mono text-[#d8dbe4]">
              <GavelIcon className="h-4 w-4 text-[#a4a8b7]" />
              <span>OFFICIAL CLAIM DOSSIER FILING</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white font-mono">
              File Property Damage Claim
            </h1>
            <p className="text-base sm:text-lg text-[#9ea3b2] leading-relaxed max-w-4xl">
              Submit verifiable evidence of catastrophic structural or water ingress damage. GenLayer
              AI validators inspect images, weather records, and policy language to formulate continuous basis-point settlements.
            </p>
          </div>
        </div>
      </section>

      {/* Main Form Area matching 1536px wide grid */}
      <div className="mx-auto max-w-[1536px] w-full px-5 sm:px-8 lg:px-12">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Target Pool & Narrative */}
            <div className="space-y-8">
              {/* Select Target Pool */}
              <div className="rounded-3xl border border-[#22242c] bg-[#141519]/70 p-6 sm:p-8 space-y-5">
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
                    className="w-full rounded-xl border border-[#22242c] bg-[#101115] px-4 py-3 text-sm sm:text-base text-white focus:border-[#424554] focus:outline-none font-mono"
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

              {/* Damage Incident Narrative */}
              <div className="rounded-3xl border border-[#22242c] bg-[#141519]/70 p-6 sm:p-8 space-y-6">
                <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2.5">
                  <span className="text-[#8a8f9c]">02.</span> Damage Incident Narrative
                </h2>

                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-mono text-[#8a8f9c] uppercase tracking-wider mb-2">
                      Damage Incident Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Roof Membrane Breach & Interior Storage Flooding"
                      value={damageTitle}
                      onChange={(e) => setDamageTitle(e.target.value)}
                      className="w-full rounded-xl border border-[#22242c] bg-[#101115] px-4 py-3 text-base text-white placeholder-[#686c7b] focus:border-[#424554] focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#8a8f9c] uppercase tracking-wider mb-2">
                      Factual Description of Physical Loss *
                    </label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Detail the timeline, wind speeds, affected structural square footage, water ingress points, and contractor quotes..."
                      value={damageDescription}
                      onChange={(e) => setDamageDescription(e.target.value)}
                      className="w-full rounded-xl border border-[#22242c] bg-[#101115] px-4 py-3 text-sm text-white placeholder-[#686c7b] focus:border-[#424554] focus:outline-none transition-colors font-sans leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#8a8f9c] uppercase tracking-wider mb-2">
                      Claimed Indemnity Amount (GEN) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      value={claimedAmount}
                      onChange={(e) => setClaimedAmount(e.target.value)}
                      className="w-full rounded-xl border border-[#22242c] bg-[#101115] px-4 py-3 text-base text-white font-mono focus:border-[#424554] focus:outline-none"
                    />
                    <span className="text-[11px] text-[#8a8f9c] mt-1 block font-mono">
                      Must not exceed the pool cap of {activePolicy ? formatWei(activePolicy.max_claim_cap) : "..."} GEN
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Admissible Evidence URLs */}
            <div className="space-y-8">
              <div className="rounded-3xl border border-[#22242c] bg-[#141519]/70 p-6 sm:p-8 space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2.5">
                    <span className="text-[#8a8f9c]">03.</span> Admissible Evidence Links
                  </h2>
                  <p className="text-xs text-[#8a8f9c] mt-1.5">
                    GenLayer validators perform independent HTTP GET queries on these endpoints under the Equivalence Principle.
                  </p>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-mono text-[#8a8f9c] uppercase tracking-wider mb-2">
                      Primary Damage Photo / Contractor Estimate (HTTPS/IPFS) *
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://images.site-inspect.example.com/claim-photos/roof-breach-oct2026.jpg"
                      value={evidenceUrl1}
                      onChange={(e) => setEvidenceUrl1(e.target.value)}
                      className="w-full rounded-xl border border-[#22242c] bg-[#101115] px-4 py-3 text-sm text-white font-mono placeholder-[#686c7b] focus:border-[#424554] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#8a8f9c] uppercase tracking-wider mb-2">
                      Secondary Evidence (Doppler Weather / Police Incident Report)
                    </label>
                    <input
                      type="url"
                      placeholder="https://weather.noaa.example.gov/radar/hurricane-gust-telemetry-oct2026.json"
                      value={evidenceUrl2}
                      onChange={(e) => setEvidenceUrl2(e.target.value)}
                      className="w-full rounded-xl border border-[#22242c] bg-[#101115] px-4 py-3 text-sm text-white font-mono placeholder-[#686c7b] focus:border-[#424554] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#8a8f9c] uppercase tracking-wider mb-2">
                      Cryptographic Evidence Fingerprint (SHA-256)
                    </label>
                    <input
                      type="text"
                      placeholder="0x... (leave blank to auto-generate from payload)"
                      value={evidenceHash}
                      onChange={(e) => setEvidenceHash(e.target.value)}
                      className="w-full rounded-xl border border-[#22242c] bg-[#101115] px-4 py-3 text-xs text-white font-mono placeholder-[#686c7b] focus:border-[#424554] focus:outline-none"
                    />
                    <span className="text-[11px] text-[#8a8f9c] mt-1 block font-mono">
                      Guarantees evidence integrity against tampering or retroactive modification.
                    </span>
                  </div>
                </div>
              </div>

              {/* Equivalence Principle Adjudication Warning */}
              <div className="rounded-3xl border border-[#22242c] bg-[#101115] p-6 space-y-3">
                <div className="font-mono text-xs uppercase tracking-wider text-white font-bold flex items-center gap-2">
                  <span>Equivalence Principle Consensus Notice</span>
                </div>
                <p className="text-xs text-[#9ea3b2] leading-relaxed">
                  Upon submission, your anti-spam stake of{" "}
                  <strong className="text-white">
                    {activePolicy ? formatWei(activePolicy.min_claimant_stake) : "10"} GEN
                  </strong>{" "}
                  will be locked into the court escrow. If multi-validator AI consensus finds that evidence
                  was fabricated, the stake is permanently slashed into the pool capital. Legitimate claims
                  receive a full stake refund upon finality.
                </p>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="rounded-3xl border border-[#22242c] bg-[#141519]/70 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-xs font-mono text-[#8a8f9c] space-y-1">
              <div>
                Target Pool: <span className="text-white font-bold">Pool #{selectedPolicyId}</span>
              </div>
              <div>
                Required Stake Deposit:{" "}
                <span className="text-white font-bold">
                  {activePolicy ? formatWei(activePolicy.min_claimant_stake) : "..."} GEN
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto">
              <Link
                href="/claims"
                className="w-full sm:w-auto px-6 py-3 rounded-full border border-[#22242c] text-sm text-[#8a8f9c] hover:text-white text-center font-mono"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={txState === "signing" || txState === "broadcasting" || txState === "waiting"}
                className="btn-pill-primary w-full sm:w-auto font-mono text-sm uppercase tracking-wider"
              >
                {txState === "signing"
                  ? "Awaiting Wallet Signature..."
                  : txState === "broadcasting" || txState === "waiting"
                  ? "Broadcasting to Studionet..."
                  : "Post Stake & File Damage Claim"}
              </button>
            </div>
          </div>

          {/* Transaction Lifecycle Status Card */}
          <TransactionLifecycle
            state={txState}
            txHash={txHash}
            errorMessage={txError}
            isOpen={txState !== "idle"}
            onClose={() => {
              setTxState("idle");
              setTxHash(undefined);
              setTxError(undefined);
            }}
            onReset={() => {
              setTxState("idle");
              setTxHash(undefined);
              setTxError(undefined);
              router.push("/claims");
            }}
          />
        </form>
      </div>
    </div>
  );
}

export default function SubmitClaimPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[1536px] w-full px-5 py-20 text-center font-mono text-sm text-[#8a8f9c]">
          Loading claim submission facility...
        </div>
      }
    >
      <SubmitClaimForm />
    </Suspense>
  );
}
