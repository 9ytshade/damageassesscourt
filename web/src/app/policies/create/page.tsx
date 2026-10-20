"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWallet } from "@/lib/use-wallet";
import { createPolicyPool } from "@/lib/genlayer";
import { TransactionLifecycle, TxState } from "@/components/transaction-lifecycle";
import { parseGenToWei } from "@/lib/safety";
import { ShieldCheckIcon, SparklesIcon, FileTextIcon, ArrowRightIcon } from "@/components/icons";

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
  const { account, isConnected, connect, assertStudionet } = useWallet();

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
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb Navigation */}
      <div className="mb-6 flex items-center gap-2 text-xs font-mono text-[#8a8f98]">
        <Link href="/policies" className="hover:text-white transition-colors">
          &larr; Risk Pools Directory
        </Link>
        <span>/</span>
        <span className="text-[#ffb829]">Underwrite Escrow Facility</span>
      </div>

      {/* Header */}
      <div className="border-b border-[#23252a] pb-6 mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#ffb829]/30 bg-[#ffb829]/10 px-3 py-1 text-xs font-mono text-[#ffb829] mb-3">
          <ShieldCheckIcon className="h-3.5 w-3.5" />
          <span>CAPITAL UNDERWRITING FACILITY</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-mono">
          Underwrite Policy Escrow Pool
        </h1>
        <p className="mt-2 text-sm text-[#8a8f98] leading-relaxed max-w-2xl">
          Lock capital into an autonomous GenLayer Intelligent Contract pool. Establish non-deterministic
          loss criteria, deductible thresholds, and governing policy terms to back property claims.
        </p>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Core Metadata */}
        <div className="linear-card p-6 sm:p-8 space-y-5">
          <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
            <span className="text-[#ffb829]">01.</span> Facility Identification
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-[#8a8f98] uppercase tracking-wider mb-1.5">
                Policy Pool Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Atlantic Coastal Windstorm & Structural Surge Pool 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-[#23252a] bg-[#141518] px-4 py-3 text-sm text-white placeholder-[#62666d] focus:border-[#ffb829] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-[#8a8f98] uppercase tracking-wider mb-1.5">
                Executive Coverage Summary *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Provide a concise description of the property classes, geographic limits, and insured events..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-[#23252a] bg-[#141518] px-4 py-3 text-sm text-white placeholder-[#62666d] focus:border-[#ffb829] focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Financial Escrow Parameters */}
        <div className="linear-card p-6 sm:p-8 space-y-5">
          <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
            <span className="text-[#ffb829]">02.</span> Escrow Capital & Risk Caps
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-mono text-[#8a8f98] uppercase tracking-wider mb-1.5">
                Initial Escrow Deposit (GEN) *
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                value={escrowAmount}
                onChange={(e) => setEscrowAmount(e.target.value)}
                className="w-full rounded-xl border border-[#23252a] bg-[#141518] px-4 py-3 font-mono text-sm text-white focus:border-[#ffb829] focus:outline-none"
              />
              <span className="text-[11px] text-[#8a8f98] mt-1 block">
                Total liquid solvency deposited into contract escrow.
              </span>
            </div>

            <div>
              <label className="block text-xs font-mono text-[#8a8f98] uppercase tracking-wider mb-1.5">
                Max Payout Cap per Claim (GEN) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                required
                value={maxClaimCap}
                onChange={(e) => setMaxClaimCap(e.target.value)}
                className="w-full rounded-xl border border-[#23252a] bg-[#141518] px-4 py-3 font-mono text-sm text-white focus:border-[#ffb829] focus:outline-none"
              />
              <span className="text-[11px] text-[#8a8f98] mt-1 block">
                Upper limit payable on any single damage incident.
              </span>
            </div>

            <div>
              <label className="block text-xs font-mono text-[#8a8f98] uppercase tracking-wider mb-1.5">
                Min Claimant Anti-Spam Stake (GEN) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                required
                value={claimantStake}
                onChange={(e) => setClaimantStake(e.target.value)}
                className="w-full rounded-xl border border-[#23252a] bg-[#141518] px-4 py-3 font-mono text-sm text-white focus:border-[#ffb829] focus:outline-none"
              />
              <span className="text-[11px] text-[#8a8f98] mt-1 block">
                Refunded upon legitimate settlement; slashed if deemed fraudulent.
              </span>
            </div>

            <div>
              <label className="block text-xs font-mono text-[#8a8f98] uppercase tracking-wider mb-1.5">
                Deductible (Basis Points) *
              </label>
              <input
                type="number"
                step="1"
                min="0"
                max="5000"
                required
                value={deductibleBps}
                onChange={(e) => setDeductibleBps(e.target.value)}
                className="w-full rounded-xl border border-[#23252a] bg-[#141518] px-4 py-3 font-mono text-sm text-white focus:border-[#ffb829] focus:outline-none"
              />
              <span className="text-[11px] text-[#8a8f98] mt-1 block">
                {deductibleBps} bps = {(parseInt(deductibleBps || "0", 10) / 100).toFixed(2)}% policy deductible.
              </span>
            </div>
          </div>
        </div>

        {/* Covered Perils Checklist */}
        <div className="linear-card p-6 sm:p-8 space-y-5">
          <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
            <span className="text-[#ffb829]">03.</span> Covered Perils & Trigger Conditions
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PRESET_PERILS.map((peril) => {
              const checked = selectedPerils.includes(peril);
              return (
                <button
                  key={peril}
                  type="button"
                  onClick={() => togglePeril(peril)}
                  className={`flex items-center gap-3 rounded-xl p-3 text-left border transition-all text-xs ${
                    checked
                      ? "border-[#ffb829] bg-[#ffb829]/10 text-white"
                      : "border-[#23252a] bg-[#141518] text-[#8a8f98] hover:text-white"
                  }`}
                >
                  <span
                    className={`h-4 w-4 rounded flex items-center justify-center border font-mono text-[10px] ${
                      checked
                        ? "border-[#ffb829] bg-[#ffb829] text-black font-bold"
                        : "border-[#383b3f]"
                    }`}
                  >
                    {checked ? "✓" : ""}
                  </span>
                  <span>{peril}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Verbatim Legal Terms */}
        <div className="linear-card p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <span className="text-[#ffb829]">04.</span> Verbatim Policy Terms & Exclusions
            </h2>
            <span className="text-[10px] font-mono text-[#8a8f98]">GenLayer Jury Reference</span>
          </div>

          <p className="text-xs text-[#8a8f98]">
            This exact text will be stored on-chain. GenLayer validator LLMs will cross-examine submitted
            photos and incident documents against these clauses during consensus adjudication.
          </p>

          <textarea
            rows={10}
            required
            value={termsText}
            onChange={(e) => setTermsText(e.target.value)}
            className="w-full rounded-xl border border-[#23252a] bg-[#08090a] p-4 font-mono text-xs text-[#d0d6e0] leading-relaxed focus:border-[#ffb829] focus:outline-none"
          />
        </div>

        {/* Submit Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#23252a]">
          <Link
            href="/policies"
            className="text-xs font-mono text-[#8a8f98] hover:text-white transition-colors"
          >
            Cancel & Return to Pools
          </Link>

          <button
            type="submit"
            disabled={txState === "signing" || txState === "broadcasting" || txState === "waiting"}
            className="btn-pill-gold font-mono w-full sm:w-auto"
          >
            <ShieldCheckIcon className="h-4 w-4" />
            <span>Underwrite & Lock Escrow ({escrowAmount} GEN)</span>
          </button>
        </div>
      </form>

      {/* Transaction Modal */}
      <TransactionLifecycle
        isOpen={txState !== "idle"}
        state={txState}
        txHash={txHash}
        errorMessage={txError}
        title="Underwriting Policy Escrow Facility"
        actionLabel="Locking Capital on GenLayer Studionet"
        onClose={() => {
          setTxState("idle");
          if (txState === "confirmed") {
            router.push("/policies");
          }
        }}
        onConfirmedAction={() => router.push("/policies")}
      />
    </div>
  );
}
