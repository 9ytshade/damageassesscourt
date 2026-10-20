"use client";

import React, { useState } from "react";
import { Claim, TxStatus } from "@/types/damageassesscourt";
import { useWallet } from "@/lib/use-wallet";
import { DAMAGEASSESSCOURT_CONTRACT_ADDRESS } from "@/lib/genlayer";
import { pollTransactionUntilFinalized } from "@/lib/tx-waiter";
import { TransactionLifecycle } from "./transaction-lifecycle";
import { CloseIcon, GavelIcon, SparklesIcon } from "./icons";

interface AdjudicateModalProps {
  claim: Claim;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AdjudicateModal({ claim, isOpen, onClose, onSuccess }: AdjudicateModalProps) {
  const { address, client } = useWallet();
  const [txStatus, setTxStatus] = useState<TxStatus>({ step: "IDLE" });
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleAdjudicate() {
    setValidationError(null);

    if (!client || !address) {
      setValidationError("Please connect your wallet first.");
      return;
    }

    try {
      setTxStatus({
        step: "PREPARING",
        message: "Initiating Equivalence Principle AI Magistrate adjudication...",
      });

      setTxStatus({
        step: "AWAITING_SIGNATURE",
        message: "Please sign the adjudication trigger in your wallet...",
      });

      const txHash = await client.writeContract({
        address: DAMAGEASSESSCOURT_CONTRACT_ADDRESS,
        functionName: "adjudicate_claim",
        args: [BigInt(claim.id)],
        value: 0n,
      });

      setTxStatus({
        step: "PENDING",
        txHash,
        message:
          "Multi-validator trial in progress. Validators are fetching evidence URLs, running AI Magistrate prompt, and reaching consensus...",
      });

      const receipt = await pollTransactionUntilFinalized(txHash);

      if (receipt.status === "FINALIZED" || receipt.status === "ACCEPTED") {
        setTxStatus({
          step: "FINALIZED",
          txHash,
          message: "Consensus reached! Proportional indemnity dished out and recorded on-chain.",
        });
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2500);
      } else {
        setTxStatus({
          step: "ERROR",
          txHash,
          error: receipt.error || "Adjudication failed to reach consensus or was rejected.",
        });
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setTxStatus({
        step: "ERROR",
        error: errMsg.includes("User rejected") ? "Signature rejected in wallet." : errMsg,
      });
    }
  }

  const isWorking =
    txStatus.step === "PREPARING" ||
    txStatus.step === "AWAITING_SIGNATURE" ||
    txStatus.step === "PENDING" ||
    txStatus.step === "ACCEPTED";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl rounded-2xl border border-court-amber/40 bg-court-midnight p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-court-amber">
            <SparklesIcon className="h-6 w-6 text-court-amber animate-pulse" />
            <h3 className="text-lg font-bold text-white font-mono">
              Convening AI Magistrate Consensus Court
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isWorking}
            className="text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div className="rounded-lg bg-slate-900/80 p-3 border border-slate-800 text-xs space-y-2">
            <div className="text-slate-300 font-semibold">
              Claim #{claim.id}: {claim.damage_title}
            </div>
            <div className="text-slate-400 text-[11px] space-y-1">
              <div>
                <span className="font-mono text-slate-300">Repair Estimate: </span>
                <span className="text-sky-300 break-all">{claim.repair_estimate_url}</span>
              </div>
              <div>
                <span className="font-mono text-slate-300">Incident Proof: </span>
                <span className="text-sky-300 break-all">{claim.incident_proof_url}</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-court-amber/5 border border-court-amber/20 p-3 text-xs text-amber-200/90 space-y-1.5">
            <div className="font-semibold text-court-amber flex items-center gap-1.5 font-mono">
              <GavelIcon className="h-4 w-4" />
              Equivalence Principle Protocol Execution:
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
              <li>Each validator independently performs HTTP GET on the external evidence URLs.</li>
              <li>Each validator feeds the policy terms, repair invoice, and weather logs into an LLM.</li>
              <li>The AI Magistrate computes exact Basis Points (0 to 10,000 BPS) proportional settlement.</li>
              <li>Consensus rule verifies canonical verdict match and tolerance within 500 BPS.</li>
              <li>Contract automatically executes atomic indemnity disbarment and stake/deposit release.</li>
            </ul>
          </div>

          {validationError && (
            <div className="rounded-lg border border-red-500/30 bg-red-950/30 p-2.5 text-xs text-red-300">
              {validationError}
            </div>
          )}

          <TransactionLifecycle status={txStatus} onReset={() => setTxStatus({ step: "IDLE" })} />

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isWorking}
              className="px-4 py-2 rounded-lg border border-slate-700 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdjudicate}
              disabled={isWorking}
              className="px-5 py-2 rounded-lg bg-court-amber hover:bg-amber-400 text-slate-950 text-sm font-bold shadow-lg shadow-amber-950/30 transition-all disabled:opacity-50 flex items-center gap-2 font-mono"
            >
              <GavelIcon className="h-4 w-4" />
              {isWorking ? "Adjudicating..." : "Trigger AI Consensus Trial"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
