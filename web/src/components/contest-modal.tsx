"use client";

import React, { useState } from "react";
import { Claim, TxStatus } from "@/types/damageassesscourt";
import { useWallet } from "@/lib/use-wallet";
import { DAMAGEASSESSCOURT_CONTRACT_ADDRESS } from "@/lib/genlayer";
import { pollTransactionUntilFinalized } from "@/lib/tx-waiter";
import { TransactionLifecycle } from "./transaction-lifecycle";
import { formatWeiAmount } from "@/lib/safety";
import { CloseIcon, GavelIcon } from "./icons";

interface ContestModalProps {
  claim: Claim;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ContestModal({ claim, isOpen, onClose, onSuccess }: ContestModalProps) {
  const { address, client } = useWallet();
  const [grievance, setGrievance] = useState("");
  const [txStatus, setTxStatus] = useState<TxStatus>({ step: "IDLE" });
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const requiredDeposit = BigInt(claim.claimant_stake || 0);

  async function handleContest(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);

    const cleanReason = grievance.trim();
    if (cleanReason.length < 20) {
      setValidationError("Grievance must be at least 20 characters explaining the policy exclusion or dispute.");
      return;
    }
    if (cleanReason.length > 3000) {
      setValidationError("Grievance cannot exceed 3,000 characters.");
      return;
    }

    if (!client || !address) {
      setValidationError("Please connect your wallet first.");
      return;
    }

    try {
      setTxStatus({ step: "PREPARING", message: "Preparing contestation transaction payload..." });

      setTxStatus({
        step: "AWAITING_SIGNATURE",
        message: "Please confirm the contestation and dispute deposit in your wallet...",
      });

      const txHash = await client.writeContract({
        address: DAMAGEASSESSCOURT_CONTRACT_ADDRESS,
        functionName: "contest_claim",
        args: [BigInt(claim.id), cleanReason],
        value: requiredDeposit,
      });

      setTxStatus({
        step: "PENDING",
        txHash,
        message: "Contestation submitted. Awaiting Studionet consensus finality...",
      });

      const receipt = await pollTransactionUntilFinalized(txHash);

      if (receipt.status === "FINALIZED" || receipt.status === "ACCEPTED") {
        setTxStatus({
          step: "FINALIZED",
          txHash,
          message: "Claim successfully contested. Defense window initiated for claimant.",
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
      <div className="relative w-full max-w-xl rounded-2xl border border-court-amber/30 bg-court-midnight p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-court-amber">
            <GavelIcon className="h-6 w-6" />
            <h3 className="text-lg font-bold text-white font-mono">
              Contest Damage Claim #{claim.id}
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

        <form onSubmit={handleContest} className="mt-4 space-y-4">
          <div className="rounded-lg bg-slate-900/80 p-3 border border-slate-800 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Claim Title:</span>
              <span className="font-semibold text-white truncate max-w-[320px]">{claim.damage_title}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Claimed Indemnity:</span>
              <span className="font-mono text-amber-300">{formatWeiAmount(claim.claimed_amount)}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Matching Dispute Deposit Required:</span>
              <span className="font-mono font-semibold text-amber-400">
                {formatWeiAmount(claim.claimant_stake)}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 pt-1">
              Note: This deposit matches the claimant anti-spam stake and is held in court escrow until magistrate ruling.
            </p>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1">
              Underwriter Dispute Grievance / Exclusion Basis
            </label>
            <textarea
              rows={4}
              value={grievance}
              onChange={(e) => setGrievance(e.target.value)}
              placeholder="Specify the exact exclusion clauses, unverified contractor charges, or pre-existing condition reasons..."
              disabled={isWorking}
              className="w-full rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-court-amber focus:outline-none disabled:opacity-50"
            />
            <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
              <span>Minimum 20 characters required.</span>
              <span>{grievance.length}/3,000</span>
            </div>
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
              type="submit"
              disabled={isWorking || grievance.trim().length < 20}
              className="px-5 py-2 rounded-lg bg-court-amber hover:bg-amber-400 text-slate-950 text-sm font-bold shadow-lg shadow-amber-950/30 transition-all disabled:opacity-50 font-mono"
            >
              {isWorking ? "Submitting..." : "Submit Contest & Escrow Deposit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
