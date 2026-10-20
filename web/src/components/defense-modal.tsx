"use client";

import React, { useState } from "react";
import { Claim, TxStatus } from "@/types/damageassesscourt";
import { useWallet } from "@/lib/use-wallet";
import { DAMAGEASSESSCOURT_CONTRACT_ADDRESS } from "@/lib/genlayer";
import { pollTransactionUntilFinalized } from "@/lib/tx-waiter";
import { TransactionLifecycle } from "./transaction-lifecycle";
import { CloseIcon, ShieldCheckIcon } from "./icons";

interface DefenseModalProps {
  claim: Claim;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DefenseModal({ claim, isOpen, onClose, onSuccess }: DefenseModalProps) {
  const { address, client } = useWallet();
  const [rebuttal, setRebuttal] = useState("");
  const [waiveTime, setWaiveTime] = useState(true);
  const [txStatus, setTxStatus] = useState<TxStatus>({ step: "IDLE" });
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleDefense(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);

    const cleanRebuttal = rebuttal.trim();
    if (cleanRebuttal.length < 20) {
      setValidationError("Defense rebuttal must be at least 20 characters refuting the underwriter grievance.");
      return;
    }
    if (cleanRebuttal.length > 3000) {
      setValidationError("Defense rebuttal cannot exceed 3,000 characters.");
      return;
    }

    if (!client || !address) {
      setValidationError("Please connect your wallet first.");
      return;
    }

    try {
      setTxStatus({ step: "PREPARING", message: "Preparing defense rebuttal payload..." });

      setTxStatus({
        step: "AWAITING_SIGNATURE",
        message: "Please sign the defense rebuttal in your wallet...",
      });

      const txHash = await client.writeContract({
        address: DAMAGEASSESSCOURT_CONTRACT_ADDRESS,
        functionName: "submit_defense",
        args: [BigInt(claim.id), cleanRebuttal, waiveTime],
        value: 0n,
      });

      setTxStatus({
        step: "PENDING",
        txHash,
        message: "Rebuttal submitted to Studionet. Polling consensus finality...",
      });

      const receipt = await pollTransactionUntilFinalized(txHash);

      if (receipt.status === "FINALIZED" || receipt.status === "ACCEPTED") {
        setTxStatus({
          step: "FINALIZED",
          txHash,
          message: waiveTime
            ? "Defense submitted and window waived. Claim is ready for immediate AI Magistrate adjudication."
            : "Defense rebuttal successfully recorded on-chain.",
        });
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      } else {
        setTxStatus({
          step: "ERROR",
          txHash,
          error: receipt.error || "Transaction was rejected during consensus.",
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
      <div className="relative w-full max-w-xl rounded-2xl border border-sky-500/30 bg-court-midnight p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-sky-400">
            <ShieldCheckIcon className="h-6 w-6" />
            <h3 className="text-lg font-bold text-white font-mono">
              Submit Defense Rebuttal for Claim #{claim.id}
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

        <form onSubmit={handleDefense} className="mt-4 space-y-4">
          {claim.contest_reason && (
            <div className="rounded-lg bg-amber-950/20 border border-court-amber/30 p-3 text-xs">
              <span className="font-mono text-amber-400 uppercase tracking-wide block font-semibold mb-1">
                Underwriter Contest Grievance:
              </span>
              <p className="text-slate-300 italic">
                &ldquo;{claim.contest_reason}&rdquo;
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1">
              Claimant Evidence & Defense Rebuttal
            </label>
            <textarea
              rows={4}
              value={rebuttal}
              onChange={(e) => setRebuttal(e.target.value)}
              placeholder="Cite line items, weather timestamps, contractor certification, or maintenance records refuting the grievance..."
              disabled={isWorking}
              className="w-full rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-400 focus:outline-none disabled:opacity-50"
            />
            <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
              <span>Minimum 20 characters required.</span>
              <span>{rebuttal.length}/3,000</span>
            </div>
          </div>

          <label className="flex items-start gap-2 cursor-pointer bg-slate-900/50 p-2.5 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
            <input
              type="checkbox"
              checked={waiveTime}
              onChange={(e) => setWaiveTime(e.target.checked)}
              disabled={isWorking}
              className="mt-0.5 rounded border-slate-700 text-sky-500 focus:ring-sky-400 bg-slate-800"
            />
            <div className="text-xs">
              <span className="font-semibold text-slate-200">
                Waive remaining defense window
              </span>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Immediately closes the defense countdown, allowing any party or validator to trigger the AI Magistrate consensus trial.
              </p>
            </div>
          </label>

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
              type="submit"
              disabled={isWorking || rebuttal.trim().length < 20}
              className="px-5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-sm font-bold shadow-lg shadow-sky-950/30 transition-all disabled:opacity-50 font-mono"
            >
              {isWorking ? "Submitting..." : "Submit Defense Rebuttal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
