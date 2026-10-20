"use client";

import React from "react";
import { TxStatus } from "@/types/damageassesscourt";
import { CheckCircleIcon, ExclamationTriangleIcon, SpinnerIcon } from "./icons";

interface TransactionLifecycleProps {
  status: TxStatus;
  onReset?: () => void;
}

export function TransactionLifecycle({ status, onReset }: TransactionLifecycleProps) {
  if (status.step === "IDLE") return null;

  const isPending =
    status.step === "PREPARING" ||
    status.step === "AWAITING_SIGNATURE" ||
    status.step === "PENDING" ||
    status.step === "ACCEPTED";
  const isFinalized = status.step === "FINALIZED";
  const isError = status.step === "ERROR";

  const stepTitles: Record<string, string> = {
    PREPARING: "Preparing Transaction",
    AWAITING_SIGNATURE: "Confirm in Wallet",
    PENDING: "Broadcasting to Studionet",
    ACCEPTED: "Transaction Accepted",
    FINALIZED: "Consensus Finalized",
    ERROR: "Transaction Failed",
  };

  return (
    <div
      className={`rounded-xl border p-4 my-4 transition-all ${
        isError
          ? "border-red-500/40 bg-red-950/20 text-red-200"
          : isFinalized
          ? "border-emerald-500/40 bg-emerald-950/20 text-emerald-200"
          : "border-court-amber/40 bg-court-amber/5 text-amber-200"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0">
          {isPending && <SpinnerIcon className="h-5 w-5 animate-spin text-court-amber" />}
          {isFinalized && <CheckCircleIcon className="h-5 w-5 text-emerald-400" />}
          {isError && <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold tracking-wide uppercase font-mono">
              {stepTitles[status.step] || status.step}
            </h4>
            {onReset && (isFinalized || isError) && (
              <button
                type="button"
                onClick={onReset}
                className="text-xs underline hover:opacity-80 transition-opacity font-mono"
              >
                Dismiss
              </button>
            )}
          </div>

          <p className="text-xs mt-1 text-slate-300">
            {status.message ||
              (status.step === "PREPARING" && "Validating parameters and encoding call...") ||
              (status.step === "AWAITING_SIGNATURE" && "Awaiting wallet signature confirmation...") ||
              (status.step === "PENDING" && "Polling GenLayer Studionet consensus finality...") ||
              (status.step === "ACCEPTED" && "Transaction recorded. Awaiting state finalization...") ||
              (status.step === "FINALIZED" && "Execution completed and state committed on-chain.") ||
              (status.step === "ERROR" && (status.error || "Execution halted due to an error."))}
          </p>

          {status.txHash && (
            <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono">Hash:</span>
              <span className="font-mono text-slate-200 truncate max-w-[280px] sm:max-w-[380px]">
                {status.txHash}
              </span>
            </div>
          )}

          {status.error && (
            <div className="mt-2 text-xs font-mono bg-red-950/40 p-2 rounded border border-red-900/50 text-red-300 break-words">
              {status.error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
