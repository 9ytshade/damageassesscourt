"use client";

import React, { useState } from "react";
import { PolicyPool } from "@/types/damageassesscourt";
import { useWallet } from "@/lib/use-wallet";
import { DAMAGEASSESSCOURT_CONTRACT_ADDRESS, pollTransactionUntilFinalized } from "@/lib/genlayer";
import { validateEvidenceUrl, formatWei } from "@/lib/safety";
import { GavelIcon, WrenchIcon, CloudStormIcon } from "@/components/icons";

interface FileClaimModalProps {
  policy: PolicyPool;
  isOpen?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function FileClaimModal({ policy, isOpen, onClose, onSuccess }: FileClaimModalProps) {
  const { isConnected, wrongNetwork, switchNetwork, getSignerClient } = useWallet();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [claimedAmountGen, setClaimedAmountGen] = useState("10");
  const [repairEstimateUrl, setRepairEstimateUrl] = useState("https://contractor.repair.example.com/estimates/quote-88219.json");
  const [incidentProofUrl, setIncidentProofUrl] = useState("https://noaa.weather.example.gov/storm-logs/gulf-oct-2026.json");

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
      setErrorText("Damage title must be at least 3 characters.");
      return;
    }
    if (description.trim().length < 20) {
      setErrorText("Damage narrative must be at least 20 characters.");
      return;
    }

    const claimedNum = parseFloat(claimedAmountGen);
    if (isNaN(claimedNum) || claimedNum <= 0) {
      setErrorText("Claimed amount must be greater than zero.");
      return;
    }

    const repairCheck = validateEvidenceUrl(repairEstimateUrl);
    if (!repairCheck.valid) {
      setErrorText(`Repair estimate URL error: ${repairCheck.error}`);
      return;
    }

    const weatherCheck = validateEvidenceUrl(incidentProofUrl);
    if (!weatherCheck.valid) {
      setErrorText(`Incident proof URL error: ${weatherCheck.error}`);
      return;
    }

    const client = getSignerClient();
    if (!client) {
      setErrorText("Could not initialize transaction signer.");
      return;
    }

    setSubmitting(true);
    setStatusText("Requesting wallet confirmation for claim filing...");

    try {
      const claimedWei = BigInt(Math.floor(claimedNum * 1e18));
      const stakeWei = BigInt(policy.min_claimant_stake.toString());

      const txHash = await client.writeContract({
        address: DAMAGEASSESSCOURT_CONTRACT_ADDRESS,
        functionName: "file_claim",
        args: [
          BigInt(policy.id),
          title.trim(),
          description.trim(),
          repairEstimateUrl.trim(),
          incidentProofUrl.trim(),
          claimedWei,
        ],
        value: stakeWei,
      });

      setStatusText("Claim broadcast. Waiting for GenLayer consensus finality...");
      await pollTransactionUntilFinalized(txHash, (update) => setStatusText(update));

      setStatusText("Damage claim filed successfully!");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: unknown) {
      console.error("Failed filing claim:", err);
      const msg = err instanceof Error ? err.message : String(err);
      setErrorText(`Claim filing failed: ${msg.slice(0, 200)}`);
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
            <GavelIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">File Property Damage Claim</h3>
            <p className="text-xs text-slate-400">
              Submitting claim under Policy #{policy.id}: {policy.title}
            </p>
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
            <label className="block text-slate-300 font-medium mb-1">Damage Incident Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Warehouse Bay 3 Roof Membrane Failure"
              className="w-full rounded-lg bg-slate-950 border border-slate-800 p-2.5 text-slate-200 focus:border-amber-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Damage Narrative Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Detail the storm timing, failure mode, and resulting property damage..."
              className="w-full rounded-lg bg-slate-950 border border-slate-800 p-2.5 text-slate-200 focus:border-amber-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Contractor Repair Estimate URL (Public JSON / HTTP Evidence)
            </label>
            <div className="flex items-center gap-2">
              <WrenchIcon className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                type="url"
                value={repairEstimateUrl}
                onChange={(e) => setRepairEstimateUrl(e.target.value)}
                placeholder="https://contractor.example.com/quote-102.json"
                className="w-full rounded-lg bg-slate-950 border border-slate-800 p-2 text-slate-200 focus:border-amber-500 focus:outline-none font-mono text-[11px]"
                required
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Must contain itemized line items differentiating covered storm repairs vs pre-existing wear.
            </p>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              NOAA / Weather Incident Log URL (Public Verification Source)
            </label>
            <div className="flex items-center gap-2">
              <CloudStormIcon className="h-4 w-4 text-cyan-400 shrink-0" />
              <input
                type="url"
                value={incidentProofUrl}
                onChange={(e) => setIncidentProofUrl(e.target.value)}
                placeholder="https://noaa.weather.example.gov/storm-logs/gulf.json"
                className="w-full rounded-lg bg-slate-950 border border-slate-800 p-2 text-slate-200 focus:border-amber-500 focus:outline-none font-mono text-[11px]"
                required
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Corroborates storm windspeed, atmospheric pressure, and peak gust intensity.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Claimed Amount (GEN)</label>
              <input
                type="number"
                step="any"
                value={claimedAmountGen}
                onChange={(e) => setClaimedAmountGen(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 p-2 text-slate-200 focus:border-amber-500 focus:outline-none font-mono"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Max cap: {formatWei(policy.max_claim_cap)} GEN
              </span>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Required Anti-Spam Stake (GEN)</label>
              <div className="rounded-lg bg-slate-950 border border-slate-800 p-2 font-mono text-emerald-400 font-semibold text-xs">
                {formatWei(policy.min_claimant_stake)} GEN
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Refunded 100% on valid claims or honest exclusion disputes.
              </span>
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
              {submitting ? "Filing Claim..." : "Deposit Stake & File Claim"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
