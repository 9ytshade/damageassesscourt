"use client";

import React, { useState } from "react";
import { useWallet } from "@/lib/use-wallet";
import { DAMAGEASSESSCOURT_CONTRACT_ADDRESS, pollTransactionUntilFinalized } from "@/lib/genlayer";
import { ShieldIcon, XCircleIcon, CheckCircleIcon } from "@/components/icons";

interface CreatePolicyModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreatePolicyModal({ isOpen, onClose, onSuccess }: CreatePolicyModalProps) {
  const { account, isConnected, wrongNetwork, switchNetwork, getSignerClient } = useWallet();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [policyTerms, setPolicyTerms] = useState(
    "Perils Covered: Windstorm damage exceeding 50mph, torrential water intrusion following structural envelope opening, and associated debris removal. Exclusions: Pre-existing structural wear, unmitigated rot, rust, gradual deterioration, and cosmetic wear."
  );
  const [escrowDepositGen, setEscrowDepositGen] = useState("50");
  const [maxClaimCapGen, setMaxClaimCapGen] = useState("10");
  const [minClaimantStakeGen, setMinClaimantStakeGen] = useState("1");
  const [reviewWindowDays, setReviewWindowDays] = useState("1");
  const [defenseWindowDays, setDefenseWindowDays] = useState("1");

  const [submitting, setSubmitting] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [errorText, setErrorText] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText("");

    if (!isConnected) {
      setErrorText("Please connect your wallet first.");
      return;
    }
    if (wrongNetwork) {
      await switchNetwork();
      return;
    }

    if (title.trim().length < 3) {
      setErrorText("Title must be at least 3 characters.");
      return;
    }
    if (description.trim().length < 20) {
      setErrorText("Description must be at least 20 characters.");
      return;
    }
    if (policyTerms.trim().length < 20) {
      setErrorText("Policy terms must be at least 20 characters.");
      return;
    }

    const escrowDeposit = parseFloat(escrowDepositGen);
    const maxCap = parseFloat(maxClaimCapGen);
    const minStake = parseFloat(minClaimantStakeGen);

    if (isNaN(escrowDeposit) || escrowDeposit <= 0) {
      setErrorText("Escrow deposit must be greater than zero.");
      return;
    }
    if (isNaN(maxCap) || maxCap <= 0 || maxCap > escrowDeposit) {
      setErrorText("Max claim cap must be greater than zero and <= initial escrow deposit.");
      return;
    }
    if (isNaN(minStake) || minStake <= 0 || minStake > maxCap) {
      setErrorText("Claimant stake must be greater than zero and <= max claim cap.");
      return;
    }

    const client = getSignerClient();
    if (!client) {
      setErrorText("Could not initialize transaction signer.");
      return;
    }

    setSubmitting(true);
    setStatusText("Requesting wallet confirmation...");

    try {
      const escrowWei = BigInt(Math.floor(escrowDeposit * 1e18));
      const maxCapWei = BigInt(Math.floor(maxCap * 1e18));
      const minStakeWei = BigInt(Math.floor(minStake * 1e18));
      const reviewSeconds = BigInt(Math.floor(parseFloat(reviewWindowDays) * 86400));
      const defenseSeconds = BigInt(Math.floor(parseFloat(defenseWindowDays) * 86400));

      const txHash = await client.writeContract({
        address: DAMAGEASSESSCOURT_CONTRACT_ADDRESS,
        functionName: "create_policy_pool",
        args: [
          title.trim(),
          description.trim(),
          policyTerms.trim(),
          maxCapWei,
          minStakeWei,
          reviewSeconds,
          defenseSeconds,
        ],
        value: escrowWei,
      });

      setStatusText("Transaction broadcast. Waiting for GenLayer consensus finality...");
      await pollTransactionUntilFinalized(txHash, (update) => setStatusText(update));

      setStatusText("Policy risk pool created successfully!");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: unknown) {
      console.error("Failed creating policy pool:", err);
      const msg = err instanceof Error ? err.message : String(err);
      setErrorText(`Transaction failed: ${msg.slice(0, 200)}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (isOpen === false) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white text-lg font-bold"
        >
          &times;
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ShieldIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Create Policy Escrow Pool</h3>
            <p className="text-xs text-slate-400">Underwrite an autonomous insurance coverage facility</p>
          </div>
        </div>

        {errorText && (
          <div className="mb-4 rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300">
            {errorText}
          </div>
        )}

        {statusText && (
          <div className="mb-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30 p-3 text-xs text-cyan-300">
            {statusText}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Policy Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Commercial Windstorm & Roof Shear Facility"
              className="w-full rounded-lg bg-slate-950 border border-slate-800 p-2.5 text-slate-200 focus:border-amber-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Facility Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Summary of risk profile and covered asset classes..."
              className="w-full rounded-lg bg-slate-950 border border-slate-800 p-2.5 text-slate-200 focus:border-amber-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Policy Terms & Exclusion Clauses (Interpreted by GenLayer AI Magistrates)
            </label>
            <textarea
              value={policyTerms}
              onChange={(e) => setPolicyTerms(e.target.value)}
              rows={4}
              className="w-full rounded-lg bg-slate-950 border border-slate-800 p-2.5 text-slate-200 focus:border-amber-500 focus:outline-none font-mono text-[11px]"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Initial Escrow (GEN)</label>
              <input
                type="number"
                step="any"
                value={escrowDepositGen}
                onChange={(e) => setEscrowDepositGen(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 p-2 text-slate-200 focus:border-amber-500 focus:outline-none font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Max Claim Cap (GEN)</label>
              <input
                type="number"
                step="any"
                value={maxClaimCapGen}
                onChange={(e) => setMaxClaimCapGen(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 p-2 text-slate-200 focus:border-amber-500 focus:outline-none font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Claimant Stake (GEN)</label>
              <input
                type="number"
                step="any"
                value={minClaimantStakeGen}
                onChange={(e) => setMinClaimantStakeGen(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 p-2 text-slate-200 focus:border-amber-500 focus:outline-none font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Review Window (Days)</label>
              <input
                type="number"
                step="0.1"
                value={reviewWindowDays}
                onChange={(e) => setReviewWindowDays(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 p-2 text-slate-200 focus:border-amber-500 focus:outline-none font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Defense Window (Days)</label>
              <input
                type="number"
                step="0.1"
                value={defenseWindowDays}
                onChange={(e) => setDefenseWindowDays(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 p-2 text-slate-200 focus:border-amber-500 focus:outline-none font-mono"
                required
              />
            </div>
          </div>

          <div className="pt-3 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 rounded-lg border border-slate-700 bg-slate-800 py-2 font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 py-2 font-semibold text-slate-950 hover:from-amber-400 hover:to-amber-500 transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
            >
              {submitting ? "Underwriting Pool..." : "Underwrite Risk Pool"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
