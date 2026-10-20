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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl rounded-3xl border border-[#2d2f38] bg-[#14151a] p-6 sm:p-7 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-[#22242c]">
          <div className="flex items-center gap-2.5 text-white">
            <SparklesIcon className="h-5 w-5 text-white animate-pulse" />
            <h3 className="text-lg font-bold text-white font-mono">
              Convening AI Magistrate Consensus Court
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isWorking}
            className="text-[#9ea3b2] hover:text-white transition-colors disabled:opacity-50"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div className="rounded-xl bg-[#0d0e12] p-4 border border-[#22242c] text-xs space-y-2">
            <div className="text-white font-semibold">
              Claim #{claim.id}: {claim.damage_title}
            </div>
            <div className="text-[#9ea3b2] text-[11px] space-y-1">
              <div>
                <span className="font-mono text-white">Repair Estimate: </span>
                <span className="text-[#d8dbe4] break-all">{claim.repair_estimate_url}</span>
              </div>
              <div>
                <span className="font-mono text-white">Incident Proof: </span>
                <span className="text-[#d8dbe4] break-all">{claim.incident_proof_url}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-[#0d0e12] border border-[#22242c] p-4 text-xs text-[#d8dbe4] space-y-2">
            <div className="font-semibold text-white flex items-center gap-2 font-mono">
              <GavelIcon className="h-4 w-4 text-white" />
              Equivalence Principle Protocol Execution:
            </div>
            <ul className="list-disc list-inside space-y-1.5 text-[#9ea3b2] text-xs">
              <li>Each validator independently performs HTTP GET on external evidence URLs.</li>
              <li>Each validator feeds policy terms, repair invoices, and weather telemetry into an LLM.</li>
              <li>The AI Magistrate computes exact Basis Points (0 to 10,000 BPS) proportional settlement.</li>
              <li>Consensus rule verifies canonical verdict match and tolerance within 500 BPS.</li>
              <li>Contract automatically executes atomic indemnity release and stake/deposit settlement.</li>
            </ul>
          </div>

          {validationError && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-xs text-rose-300">
              {validationError}
            </div>
          )}

          <TransactionLifecycle status={txStatus} onReset={() => setTxStatus({ step: "IDLE" })} />

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isWorking}
              className="px-4 py-2 rounded-full border border-[#2d2f38] text-xs font-semibold text-[#d8dbe4] hover:bg-[#1f212a] hover:text-white transition-colors disabled:opacity-50 font-mono uppercase"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdjudicate}
              disabled={isWorking}
              className="px-5 py-2.5 rounded-full bg-white hover:bg-[#e4e7ee] text-black text-xs font-bold shadow-lg transition-all disabled:opacity-50 flex items-center gap-2 font-mono uppercase tracking-wider"
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
