"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWallet } from "@/lib/use-wallet";
import { createPolicyPool } from "@/lib/genlayer";
import { TransactionLifecycle, TxState } from "@/components/transaction-lifecycle";
import { parseGenToWei } from "@/lib/safety";
import { ShieldCheckIcon } from "@/components/icons";

const PRESET_PERILS = [
  "Hurricane & Windstorm (Category 1-5)",
  "Hail & Roof Impact (>1.5 inches)",
  "Water Pipe Burst & Interior Flooding",
  "Flash Flood Surge (Storm Ingress)",
  "Wildfire & Structural Embers",
  "Seismic & Foundation Shift",
];

const DEFAULT_TERMS = `SECTION 1. INDEMNITY COVERAGE
This decentralized insurance pool indemnifies the claimant against direct physical loss caused by specified perils during the active policy epoch.

SECTION 2. ADMISSIBLE EVIDENCE
Claims must be accompanied by non-fungible photographic evidence, geolocation-stamped weather radar reports, and/or municipal emergency dispatch incident numbers. Unsubstantiated claims will be dismissed.

SECTION 3. EXCLUSIONS & LIMITATIONS
No indemnity shall be paid for:
a) Pre-existing physical wear, tear, rust, gradual deterioration, or neglect.
b) Intentional damage, gross negligence, or fraudulent amplification of claimed loss.
c) Consequential business disruption or unrecorded auxiliary expenses.

SECTION 4. DISPUTE RESOLUTION
GenLayer AI consensus acts as the magistrate jury. All damage percentages (0-10,000 basis points) are evaluated by multi-validator consensus across policy language, physical imagery, and weather data. Settlement releases escrow directly to the claimant address upon finality.`;

export default function CreatePolicyPage() {
  const router = useRouter();
  const { isConnected, connect, assertStudionet } = useWallet();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [escrowAmount, setEscrowAmount] = useState("1000");
  const [maxClaimCap, setMaxClaimCap] = useState("250");
  const [claimantStake, setClaimantStake] = useState("10");
  const [deductibleBps, setDeductibleBps] = useState("500");
  const [selectedPerils, setSelectedPerils] = useState<string[]>([
    "Hurricane & Windstorm (Category 1-5)",
    "Hail & Roof Impact (>1.5 inches)",
    "Water Pipe Burst & Interior Flooding",
  ]);
  const [termsText, setTermsText] = useState(DEFAULT_TERMS);

  const [txState, setTxState] = useState<TxState>("idle");
  const [txHash, setTxHash] = useState<string | undefined>(undefined);
  const [txError, setTxError] = useState<string | undefined>(undefined);

  const togglePeril = (peril: string) => {
    setSelectedPerils((prev) =>
      prev.includes(peril) ? prev.filter((p) => p !== peril) : [...prev, peril]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      const ok = await connect();
      if (!ok) return;
    }

    const onRightNet = await assertStudionet();
    if (!onRightNet) return;

    if (!title.trim() || !description.trim()) {
      alert("Please provide both a policy title and description.");
      return;
    }

    const escrowWei = parseGenToWei(escrowAmount);
    const capWei = parseGenToWei(maxClaimCap);
    const stakeWei = parseGenToWei(claimantStake);
    const dedBps = parseInt(deductibleBps, 10);

    if (escrowWei <= BigInt(0) || capWei <= BigInt(0)) {
      alert("Escrow and max claim cap must be greater than zero.");
      return;
    }

    try {
      setTxState("signing");
      setTxError(undefined);

      const res = await createPolicyPool(
        title,
        description,
        termsText,
        selectedPerils,
        escrowWei,
        capWei,
        stakeWei,
        dedBps,
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
        setTxError(res.error || "Failed to create policy pool.");
        setTxState("error");
      }
    } catch (err: unknown) {
      console.error("Policy creation error:", err);
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
            <Link href="/policies" className="hover:text-white transition-colors">
              &larr; Risk Pools Directory
            </Link>
            <span>/</span>
            <span className="text-white">Underwrite Escrow Facility</span>
          </div>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#2a2d36] bg-[#121317] px-4 py-1.5 text-xs font-mono text-[#d8dbe4]">
              <ShieldCheckIcon className="h-4 w-4 text-[#a4a8b7]" />
              <span>CAPITAL UNDERWRITING FACILITY</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white font-mono">
              Underwrite Policy Escrow Pool
            </h1>
            <p className="text-base sm:text-lg text-[#9ea3b2] leading-relaxed max-w-4xl">
              Lock capital into an autonomous GenLayer Intelligent Contract pool. Establish non-deterministic
              loss criteria, deductible thresholds, and governing policy terms to back property claims.
            </p>
          </div>
        </div>
      </section>

      {/* Main Form Area matching 1536px wide grid */}
      <div className="mx-auto max-w-[1536px] w-full px-5 sm:px-8 lg:px-12">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Core Metadata & Perils */}
            <div className="space-y-8">
              {/* Core Metadata */}
              <div className="rounded-3xl border border-[#22242c] bg-[#141519]/70 p-6 sm:p-8 space-y-6">
                <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2.5">
                  <span className="text-[#8a8f9c]">01.</span> Facility Identification
                </h2>

                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-mono text-[#8a8f9c] uppercase tracking-wider mb-2">
                      Policy Pool Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Atlantic Coastal Windstorm & Structural Surge Pool 2026"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full rounded-xl border border-[#22242c] bg-[#101115] px-4 py-3 text-base text-white placeholder-[#686c7b] focus:border-[#424554] focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#8a8f9c] uppercase tracking-wider mb-2">
                      Executive Coverage Summary *
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Brief overview explaining what structural assets this pool covers and under what conditions..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full rounded-xl border border-[#22242c] bg-[#101115] px-4 py-3 text-sm text-white placeholder-[#686c7b] focus:border-[#424554] focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Covered Perils Preset Selector */}
              <div className="rounded-3xl border border-[#22242c] bg-[#141519]/70 p-6 sm:p-8 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2.5">
                    <span className="text-[#8a8f9c]">02.</span> Covered Perils
                  </h2>
                  <span className="text-xs font-mono text-[#8a8f9c]">
                    {selectedPerils.length} Selected
                  </span>
                </div>
                <p className="text-xs text-[#8a8f9c]">
                  Select the catastrophic physical peril categories that GenLayer AI validators will check during adjudication.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PRESET_PERILS.map((peril) => {
                    const isSelected = selectedPerils.includes(peril);
                    return (
                      <button
                        type="button"
                        key={peril}
                        onClick={() => togglePeril(peril)}
                        className={`text-left p-3.5 rounded-xl border text-xs font-mono transition-all flex items-center justify-between ${
                          isSelected
                            ? "border-white bg-[#1a1c24] text-white font-semibold"
                            : "border-[#22242c] bg-[#101115] text-[#8a8f9c] hover:border-[#343846] hover:text-white"
                        }`}
                      >
                        <span>{peril}</span>
                        <span className="text-base">{isSelected ? "✓" : "+"}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Capital Stakes & Policy Wording */}
            <div className="space-y-8">
              {/* Financial Capital Parameters */}
              <div className="rounded-3xl border border-[#22242c] bg-[#141519]/70 p-6 sm:p-8 space-y-6">
                <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2.5">
                  <span className="text-[#8a8f9c]">03.</span> Escrow Capital &amp; Caps
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-mono text-[#8a8f9c] uppercase tracking-wider mb-2">
                      Initial Pool Escrow (GEN) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      value={escrowAmount}
                      onChange={(e) => setEscrowAmount(e.target.value)}
                      className="w-full rounded-xl border border-[#22242c] bg-[#101115] px-4 py-3 text-base text-white font-mono focus:border-[#424554] focus:outline-none"
                    />
                    <span className="text-[11px] text-[#8a8f9c] mt-1 block font-mono">
                      Locked upon pool deployment
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#8a8f9c] uppercase tracking-wider mb-2">
                      Max Per-Claim Cap (GEN) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      value={maxClaimCap}
                      onChange={(e) => setMaxClaimCap(e.target.value)}
                      className="w-full rounded-xl border border-[#22242c] bg-[#101115] px-4 py-3 text-base text-white font-mono focus:border-[#424554] focus:outline-none"
                    />
                    <span className="text-[11px] text-[#8a8f9c] mt-1 block font-mono">
                      Maximum indemnity per filing
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#8a8f9c] uppercase tracking-wider mb-2">
                      Required Anti-Spam Stake (GEN)
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="any"
                      value={claimantStake}
                      onChange={(e) => setClaimantStake(e.target.value)}
                      className="w-full rounded-xl border border-[#22242c] bg-[#101115] px-4 py-3 text-base text-white font-mono focus:border-[#424554] focus:outline-none"
                    />
                    <span className="text-[11px] text-[#8a8f9c] mt-1 block font-mono">
                      Slashed if fraud is proven
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#8a8f9c] uppercase tracking-wider mb-2">
                      Deductible Threshold (BPS)
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="5000"
                      value={deductibleBps}
                      onChange={(e) => setDeductibleBps(e.target.value)}
                      className="w-full rounded-xl border border-[#22242c] bg-[#101115] px-4 py-3 text-base text-white font-mono focus:border-[#424554] focus:outline-none"
                    />
                    <span className="text-[11px] text-[#8a8f9c] mt-1 block font-mono">
                      500 bps = 5.00% deduction
                    </span>
                  </div>
                </div>
              </div>

              {/* Legal Policy Terms */}
              <div className="rounded-3xl border border-[#22242c] bg-[#141519]/70 p-6 sm:p-8 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2.5">
                    <span className="text-[#8a8f9c]">04.</span> Verbatim Policy Terms
                  </h2>
                  <span className="text-xs font-mono text-[#8a8f9c]">
                    Read by GenLayer AI Jury
                  </span>
                </div>
                <p className="text-xs text-[#8a8f9c]">
                  Validators parse this contract text to cross-examine evidence URLs and calculate Basis Points indemnity.
                </p>

                <textarea
                  required
                  rows={8}
                  value={termsText}
                  onChange={(e) => setTermsText(e.target.value)}
                  className="w-full rounded-xl border border-[#22242c] bg-[#101115] p-4 text-xs text-[#f0f2f5] font-mono leading-relaxed focus:border-[#424554] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="rounded-3xl border border-[#22242c] bg-[#141519]/70 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-xs font-mono text-[#8a8f9c] space-y-1">
              <div>
                Transaction Target: <span className="text-white">GenLayer Studionet (Chain 61999)</span>
              </div>
              <div>
                Initial Liquidity: <span className="text-white font-bold">{escrowAmount} GEN</span>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto">
              <Link
                href="/policies"
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
                  ? "Confirming on Studionet..."
                  : `Fund Escrow & Deploy Pool (${escrowAmount} GEN)`}
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
              router.push("/policies");
            }}
          />
        </form>
      </div>
    </div>
  );
}
