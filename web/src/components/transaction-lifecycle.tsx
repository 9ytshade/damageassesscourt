"use client";

import React from "react";
import { TxStatus } from "@/types/damageassesscourt";
import { CheckCircleIcon, ExclamationTriangleIcon, SpinnerIcon } from "./icons";

export type TxState = "idle" | "signing" | "broadcasting" | "waiting" | "confirmed" | "error";

export interface TransactionLifecycleProps {
  status?: TxStatus;
  state?: TxState;
  isOpen?: boolean;
  txHash?: string;
  errorMessage?: string;
  title?: string;
  actionLabel?: string;
  onReset?: () => void;
  onClose?: () => void;
  onConfirmedAction?: () => void;
}

export function TransactionLifecycle({
  status,
  state,
  isOpen,
  txHash,
  errorMessage,
  title,
  actionLabel,
  onReset,
  onClose,
  onConfirmedAction,
}: TransactionLifecycleProps) {
  // If used as modal with isOpen / state props
  if (isOpen !== undefined) {
    if (!isOpen || state === "idle") return null;

    const isPending = state === "signing" || state === "broadcasting" || state === "waiting";
    const isConfirmed = state === "confirmed";
    const isErr = state === "error";

    return (
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 text-left"
      >
        <div className="w-full max-w-md rounded-2xl border border-[#23252a] bg-[#0c0d0e] p-6 shadow-2xl relative">
          <div className="flex items-center gap-3 mb-4">
            {isPending && <SpinnerIcon className="h-6 w-6 text-[#ffb829] animate-spin shrink-0" />}
            {isConfirmed && <CheckCircleIcon className="h-6 w-6 text-emerald-400 shrink-0" />}
            {isErr && <ExclamationTriangleIcon className="h-6 w-6 text-rose-500 shrink-0" />}
            <div>
              <h3 className="text-base font-bold text-white font-mono">
                {title || "Transaction Execution"}
              </h3>
              <p className="text-xs text-[#8a8f98]">
                {actionLabel || "GenLayer Studionet"}
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-[#141518] p-4 border border-[#23252a] text-xs font-mono space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[#8a8f98]">Status:</span>
              <span className="font-bold text-white uppercase">{state}</span>
            </div>

            {state === "signing" && (
              <p className="text-[#ffb829]">Please confirm the transaction in your browser wallet...</p>
            )}
            {state === "broadcasting" && (
              <p className="text-slate-300">Broadcasting transaction to GenLayer Studionet RPC...</p>
            )}
            {state === "waiting" && (
              <p className="text-amber-300">Waiting for validator AI consensus finality on Studionet...</p>
            )}
            {isConfirmed && (
              <p className="text-emerald-400 font-semibold">Transaction accepted and finalized on-chain!</p>
            )}
            {isErr && (
              <p className="text-rose-400 break-words">{errorMessage || "Transaction was rejected or failed."}</p>
            )}

            {txHash && (
              <div className="pt-2 border-t border-[#23252a] text-[11px] break-all">
                <span className="text-[#8a8f98] block">Transaction Hash:</span>
                <span className="text-slate-200">{txHash}</span>
              </div>
            )}
          </div>

          <div className="mt-5 flex items-center justify-end gap-3">
            {(isConfirmed || isErr) && (
              <button
                onClick={() => {
                  if (isConfirmed && onConfirmedAction) {
                    onConfirmedAction();
                  } else if (onClose) {
                    onClose();
                  }
                }}
                className="btn-pill-gold text-xs px-5 py-2 font-mono"
              >
                {isConfirmed ? "Continue" : "Dismiss"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Fallback to inline component if used with status prop
  if (!status || status.step === "IDLE") return null;

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
