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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl rounded-3xl border border-[#2d2f38] bg-[#14151a] p-6 sm:p-7 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-[#22242c]">
          <div className="flex items-center gap-2.5 text-white">
            <ShieldCheckIcon className="h-5 w-5 text-white" />
            <h3 className="text-lg font-bold text-white font-mono">
              Submit Defense Rebuttal for Claim #{claim.id}
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

        <form onSubmit={handleDefense} className="mt-5 space-y-4">
          {claim.contest_reason && (
            <div className="rounded-xl bg-[#0d0e12] border border-[#22242c] p-3.5 text-xs">
              <span className="font-mono text-white uppercase tracking-wide block font-semibold mb-1">
                Underwriter Contest Grievance:
              </span>
              <p className="text-[#d8dbe4] italic leading-relaxed">
                &ldquo;{claim.contest_reason}&rdquo;
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#d8dbe4] mb-1.5 font-semibold">
              Claimant Evidence &amp; Defense Rebuttal
            </label>
            <textarea
              rows={4}
              value={rebuttal}
              onChange={(e) => setRebuttal(e.target.value)}
              placeholder="Cite line items, weather timestamps, contractor certification, or maintenance records refuting the grievance..."
              disabled={isWorking}
              className="w-full rounded-xl border border-[#2d2f38] bg-[#0d0e12] px-3.5 py-2.5 text-sm text-[#f0f2f5] placeholder-[#6f7384] focus:border-white focus:outline-none disabled:opacity-50 transition-colors"
            />
            <div className="flex justify-between items-center text-[11px] font-mono text-[#8a8f9d] mt-1.5">
              <span>Minimum 20 characters required.</span>
              <span>{rebuttal.length}/3,000</span>
            </div>
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer bg-[#0d0e12] p-3 rounded-xl border border-[#22242c] hover:border-[#2d2f38] transition-colors">
            <input
              type="checkbox"
              checked={waiveTime}
              onChange={(e) => setWaiveTime(e.target.checked)}
              disabled={isWorking}
              className="mt-0.5 rounded border-[#2d2f38] text-white focus:ring-white bg-[#14151a]"
            />
            <div className="text-xs">
              <span className="font-semibold text-white">
                Waive remaining defense window
              </span>
              <p className="text-[#8a8f9d] text-[11px] mt-0.5">
                Immediately closes the defense countdown, allowing any party or validator to trigger the AI Magistrate consensus trial.
              </p>
            </div>
          </label>

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
              type="submit"
              disabled={isWorking || rebuttal.trim().length < 20}
              className="px-5 py-2.5 rounded-full bg-white hover:bg-[#e4e7ee] text-black text-xs font-bold shadow-lg transition-all disabled:opacity-50 font-mono uppercase tracking-wider"
            >
              {isWorking ? "Submitting..." : "Submit Defense Rebuttal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
