"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { Claim, PolicyPool, Verdict, TxStatus } from "@/types/damageassesscourt";
import { fetchClaim, fetchPolicyPool, fetchVerdict, DAMAGEASSESSCOURT_CONTRACT_ADDRESS } from "@/lib/genlayer";
import { useWallet } from "@/lib/use-wallet";
import { pollTransactionUntilFinalized } from "@/lib/tx-waiter";
import { formatWeiAmount, formatAddress, calculateBpsSettlement, isValidHttpsUrl } from "@/lib/safety";
import { ContestModal } from "@/components/contest-modal";
import { DefenseModal } from "@/components/defense-modal";
import { AdjudicateModal } from "@/components/adjudicate-modal";
import { TransactionLifecycle } from "@/components/transaction-lifecycle";
import {
  GavelIcon,
  ShieldCheckIcon,
  SparklesIcon,
  BuildingOfficeIcon,
  ClockIcon,
  DocumentTextIcon,
  ArrowTopRightOnSquareIcon,
  ExclamationTriangleIcon,
} from "@/components/icons";

interface ClaimPageProps {
  params: Promise<{ id: string }>;
}

export default function ClaimWorkstationPage({ params }: ClaimPageProps) {
  const resolvedParams = use(params);
  const claimId = Number(resolvedParams.id);

  const { address, client } = useWallet();

  const [claim, setClaim] = useState<Claim | null>(null);
  const [policy, setPolicy] = useState<PolicyPool | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [loading, setLoading] = useState(true);

  const [isContestOpen, setIsContestOpen] = useState(false);
  const [isDefenseOpen, setIsDefenseOpen] = useState(false);
  const [isAdjudicateOpen, setIsAdjudicateOpen] = useState(false);

  const [actionTxStatus, setActionTxStatus] = useState<TxStatus>({ step: "IDLE" });

  async function loadClaimDetails() {
    setLoading(true);
    try {
      const claimRes = await fetchClaim(claimId);
      if (claimRes.claim) {
        setClaim(claimRes.claim);

        const [policyRes, verdictRes] = await Promise.all([
          fetchPolicyPool(claimRes.claim.policy_id),
          claimRes.claim.verdict_id > 0
            ? fetchVerdict(claimRes.claim.verdict_id)
            : Promise.resolve({ verdict: null, isFallback: false }),
        ]);

        setPolicy(policyRes.policy);
        setVerdict(verdictRes.verdict);
      }
    } catch (err) {
      console.error("Failed loading claim details:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClaimDetails();
  }, [claimId]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-20 text-center font-mono text-slate-400">
        Loading damage claim dossier #{claimId} from GenLayer Studionet...
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="rounded-2xl border border-red-900/50 bg-red-950/20 p-12 text-center text-red-300 font-mono">
        Claim #{claimId} was not found on-chain.
      </div>
    );
  }

  const now = Math.floor(Date.now() / 1000);
  const isClaimant = address && address.toLowerCase() === claim.claimant.toLowerCase();
  const isUnderwriter = address && policy && address.toLowerCase() === policy.underwriter.toLowerCase();

  const isReviewWindowOpen = claim.status === "submitted" && now < claim.review_deadline;
  const isReviewWindowExpired = claim.status === "submitted" && now >= claim.review_deadline;
  const isDefenseWindowOpen =
    (claim.status === "contested" || claim.status === "defended") &&
    claim.defense_deadline > 0 &&
    now < claim.defense_deadline;
  const isReadyForAdjudication =
    (claim.status === "contested" || claim.status === "defended") &&
    (claim.defense_deadline === 0 || now >= claim.defense_deadline);

  // Fast-path Approve Claim (Underwriter)
  async function handleFastPathApprove() {
    if (!client || !address || !claim) return;
    try {
      setActionTxStatus({ step: "AWAITING_SIGNATURE", message: "Confirming full claim approval..." });
      const txHash = await client.writeContract({
        address: DAMAGEASSESSCOURT_CONTRACT_ADDRESS,
        functionName: "approve_claim",
        args: [BigInt(claim.id)],
        value: 0n,
      });
      setActionTxStatus({ step: "PENDING", txHash, message: "Claim approval broadcasted to Studionet..." });
      const receipt = await pollTransactionUntilFinalized(txHash);
      if (receipt.status === "FINALIZED" || receipt.status === "ACCEPTED") {
        setActionTxStatus({ step: "FINALIZED", txHash, message: "Claim approved and full payout disbursed!" });
        setTimeout(() => loadClaimDetails(), 2000);
      } else {
        setActionTxStatus({ step: "ERROR", txHash, error: receipt.error || "Approval transaction failed." });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionTxStatus({ step: "ERROR", error: msg });
    }
  }

  // Claim Uncontested Payout (Claimant)
  async function handleClaimUncontestedPayout() {
    if (!client || !address || !claim) return;
    try {
      setActionTxStatus({ step: "AWAITING_SIGNATURE", message: "Confirming uncontested payout withdrawal..." });
      const txHash = await client.writeContract({
        address: DAMAGEASSESSCOURT_CONTRACT_ADDRESS,
        functionName: "claim_uncontested_payout",
        args: [BigInt(claim.id)],
        value: 0n,
      });
      setActionTxStatus({ step: "PENDING", txHash, message: "Broadcasting uncontested payout execution..." });
      const receipt = await pollTransactionUntilFinalized(txHash);
      if (receipt.status === "FINALIZED" || receipt.status === "ACCEPTED") {
        setActionTxStatus({ step: "FINALIZED", txHash, message: "Uncontested payout and stake returned to claimant!" });
        setTimeout(() => loadClaimDetails(), 2000);
      } else {
        setActionTxStatus({ step: "ERROR", txHash, error: receipt.error || "Execution failed." });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionTxStatus({ step: "ERROR", error: msg });
    }
  }

  // Terminal Exhaustion Recovery
  async function handleResolveExhausted() {
    if (!client || !address || !claim) return;
    try {
      setActionTxStatus({ step: "AWAITING_SIGNATURE", message: "Confirming exhaustion recovery..." });
      const txHash = await client.writeContract({
        address: DAMAGEASSESSCOURT_CONTRACT_ADDRESS,
        functionName: "resolve_exhausted_claim",
        args: [BigInt(claim.id)],
        value: 0n,
      });
      setActionTxStatus({ step: "PENDING", txHash, message: "Executing exhaustion recovery..." });
      const receipt = await pollTransactionUntilFinalized(txHash);
      if (receipt.status === "FINALIZED" || receipt.status === "ACCEPTED") {
        setActionTxStatus({ step: "FINALIZED", txHash, message: "Claim safely marked exhausted; escrow liabilities returned." });
        setTimeout(() => loadClaimDetails(), 2000);
      } else {
        setActionTxStatus({ step: "ERROR", txHash, error: receipt.error || "Exhaustion recovery failed." });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionTxStatus({ step: "ERROR", error: msg });
    }
  }

  const bpsMath = verdict
    ? calculateBpsSettlement(
        claim.claimed_amount,
        verdict.settlement_bps,
        claim.claimant_stake,
        claim.underwriter_deposit
      )
    : null;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Dossier Header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full font-mono text-xs font-bold border border-court-amber/40 bg-court-amber/10 text-court-amber">
              Claim Dossier #{claim.id}
            </span>
            <span
              className={`px-3 py-1 rounded-full font-mono text-xs uppercase tracking-wider font-semibold border ${
                claim.status === "approved" || claim.status === "resolved"
                  ? "border-emerald-500/40 bg-emerald-950/20 text-emerald-300"
                  : claim.status === "contested" || claim.status === "defended"
                  ? "border-amber-500/40 bg-amber-950/20 text-amber-300"
                  : claim.status === "rejected_slashed"
                  ? "border-red-500/40 bg-red-950/20 text-red-300"
                  : "border-sky-500/40 bg-sky-950/20 text-sky-300"
              }`}
            >
              Status: {claim.status.replace("_", " ")}
            </span>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            Filed: {new Date(claim.submitted_at * 1000).toLocaleString()}
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-white font-serif">
          {claim.damage_title}
        </h1>

        <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-400 font-mono pt-2 border-t border-slate-800">
          <div>
            Claimant:{" "}
            <span className="text-slate-200">{formatAddress(claim.claimant)}</span>
            {isClaimant && <span className="ml-1 text-court-amber font-bold">(You)</span>}
          </div>

          {policy && (
            <div>
              Risk Pool:{" "}
              <Link
                href={`/policies`}
                className="text-court-amber hover:underline inline-flex items-center gap-1"
              >
                <BuildingOfficeIcon className="h-3.5 w-3.5" />
                Pool #{policy.id} ({policy.title.slice(0, 30)}...)
              </Link>
              {isUnderwriter && <span className="ml-1 text-emerald-400 font-bold">(Underwriter)</span>}
            </div>
          )}
        </div>
      </div>

      {/* Financial Stakes & Liability Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <div className="text-xs uppercase font-mono text-slate-400">Claimed Indemnity</div>
          <div className="mt-1.5 text-xl font-bold text-amber-300 font-mono">
            {formatWeiAmount(claim.claimed_amount)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Requested contractor payout</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <div className="text-xs uppercase font-mono text-slate-400">Claimant Anti-Spam Stake</div>
          <div className="mt-1.5 text-xl font-bold text-slate-200 font-mono">
            {formatWeiAmount(claim.claimant_stake)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Locked during adjudication</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <div className="text-xs uppercase font-mono text-slate-400">Underwriter Dispute Deposit</div>
          <div className="mt-1.5 text-xl font-bold text-slate-200 font-mono">
            {formatWeiAmount(claim.underwriter_deposit)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Matches stake when contested</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <div className="text-xs uppercase font-mono text-slate-400">Adjudication Outcome</div>
          <div
            className={`mt-1.5 text-xl font-bold font-mono ${
              verdict ? "text-emerald-400" : "text-slate-500"
            }`}
          >
            {verdict ? `${(verdict.settlement_bps / 100).toFixed(2)}% BPS` : "Pending"}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {verdict ? verdict.canonical_verdict : "Awaiting consensus"}
          </div>
        </div>
      </div>

      {/* Evidence & Damage Narrative */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Damage Narrative */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-3">
            <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <DocumentTextIcon className="h-5 w-5 text-court-amber" />
              Property Damage Description
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
              {claim.damage_description}
            </p>
          </div>

          {/* External Evidence Links */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
            <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <ShieldCheckIcon className="h-5 w-5 text-emerald-400" />
              Cryptographic & External Telemetry Evidence
            </h3>

            <div className="space-y-3">
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4 space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400 uppercase">Contractor Repair Estimate (Quote):</span>
                  {isValidHttpsUrl(claim.repair_estimate_url) && (
                    <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                      <ShieldCheckIcon className="h-3.5 w-3.5" /> HTTPS Verified
                    </span>
                  )}
                </div>
                <a
                  href={claim.repair_estimate_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-mono text-sky-400 hover:text-sky-300 hover:underline break-all inline-flex items-center gap-1.5"
                >
                  {claim.repair_estimate_url}
                  <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 flex-shrink-0" />
                </a>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4 space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400 uppercase">Official NOAA / Weather Proof Report:</span>
                  {isValidHttpsUrl(claim.incident_proof_url) && (
                    <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                      <ShieldCheckIcon className="h-3.5 w-3.5" /> HTTPS Verified
                    </span>
                  )}
                </div>
                <a
                  href={claim.incident_proof_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-mono text-sky-400 hover:text-sky-300 hover:underline break-all inline-flex items-center gap-1.5"
                >
                  {claim.incident_proof_url}
                  <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 flex-shrink-0" />
                </a>
              </div>

              <div className="pt-2 text-xs font-mono text-slate-500 flex items-center justify-between">
                <span>Evidence SHA-256 Fingerprint:</span>
                <span className="text-slate-400 truncate max-w-[280px] sm:max-w-[400px]">
                  {claim.evidence_hash}
                </span>
              </div>
            </div>
          </div>

          {/* Underwriter Grievance & Claimant Defense Rebuttal */}
          {(claim.contest_reason || claim.defense_rebuttal) && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
              <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <GavelIcon className="h-5 w-5 text-court-amber" />
                Dispute Exclusions & Defense Rebuttal Exchange
              </h3>

              {claim.contest_reason && (
                <div className="rounded-xl border border-court-amber/30 bg-amber-950/20 p-4 space-y-1">
                  <div className="text-xs font-mono font-bold uppercase text-court-amber">
                    Underwriter Contest Grievance:
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 italic leading-relaxed">
                    &ldquo;{claim.contest_reason}&rdquo;
                  </p>
                </div>
              )}

              {claim.defense_rebuttal && (
                <div className="rounded-xl border border-sky-500/30 bg-sky-950/20 p-4 space-y-1">
                  <div className="text-xs font-mono font-bold uppercase text-sky-400">
                    Claimant Defense Rebuttal:
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 italic leading-relaxed">
                    &ldquo;{claim.defense_rebuttal}&rdquo;
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar: Procedural Actions & Windows */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-5">
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <ClockIcon className="h-4 w-4 text-court-amber" />
              Court Windows & Actions
            </h3>

            {/* Countdown / Window Indicators */}
            {claim.status === "submitted" && (
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3.5 space-y-1 text-xs">
                <div className="flex justify-between font-mono">
                  <span className="text-slate-400">Underwriter Review:</span>
                  <span className={isReviewWindowOpen ? "text-amber-400" : "text-slate-500"}>
                    {isReviewWindowOpen ? "Active Countdown" : "Window Expired"}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Deadline: {new Date(claim.review_deadline * 1000).toLocaleString()}
                </div>
              </div>
            )}

            {(claim.status === "contested" || claim.status === "defended") && (
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3.5 space-y-1 text-xs">
                <div className="flex justify-between font-mono">
                  <span className="text-slate-400">Claimant Defense Window:</span>
                  <span className={isDefenseWindowOpen ? "text-sky-400" : "text-emerald-400"}>
                    {isDefenseWindowOpen ? "Defense Active" : "Ready for Trial"}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  {claim.defense_deadline > 0
                    ? `Deadline: ${new Date(claim.defense_deadline * 1000).toLocaleString()}`
                    : "Window waived by claimant."}
                </div>
              </div>
            )}

            {/* Action Buttons based on roles */}
            <div className="space-y-2.5 pt-2">
              {/* Underwriter fast-path actions */}
              {isUnderwriter && isReviewWindowOpen && (
                <>
                  <button
                    onClick={handleFastPathApprove}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase font-mono tracking-wider transition-colors"
                  >
                    Approve Claim (100% Payout)
                  </button>
                  <button
                    onClick={() => setIsContestOpen(true)}
                    className="w-full py-2.5 px-4 rounded-xl border border-court-amber bg-court-amber/10 hover:bg-court-amber text-court-amber hover:text-slate-950 font-bold text-xs uppercase font-mono tracking-wider transition-colors"
                  >
                    Contest Claim (Grievance & Deposit)
                  </button>
                </>
              )}

              {/* Claimant uncontested payout */}
              {isClaimant && isReviewWindowExpired && (
                <button
                  onClick={handleClaimUncontestedPayout}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase font-mono tracking-wider transition-colors"
                >
                  Claim Uncontested Payout
                </button>
              )}

              {/* Claimant defense rebuttal */}
              {isClaimant && isDefenseWindowOpen && (
                <button
                  onClick={() => setIsDefenseOpen(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs uppercase font-mono tracking-wider transition-colors"
                >
                  Submit Defense Rebuttal
                </button>
              )}

              {/* AI Magistrate Adjudication Trigger */}
              {isReadyForAdjudication && (
                <button
                  onClick={() => setIsAdjudicateOpen(true)}
                  className="w-full py-3 px-4 rounded-xl bg-court-amber hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase font-mono tracking-wider transition-all shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2"
                >
                  <SparklesIcon className="h-4 w-4" />
                  Trigger AI Magistrate Trial
                </button>
              )}

              {/* Exhaustion Recovery */}
              {(claim.status === "contested" || claim.status === "defended") &&
                (claim.attempt_count >= 5 || now - claim.submitted_at >= 86400) && (
                  <button
                    onClick={handleResolveExhausted}
                    className="w-full py-2.5 px-4 rounded-xl border border-red-500/50 bg-red-950/20 hover:bg-red-950 text-red-300 font-bold text-xs uppercase font-mono tracking-wider transition-colors"
                  >
                    Resolve Exhausted Claim
                  </button>
                )}
            </div>

            <TransactionLifecycle
              status={actionTxStatus}
              onReset={() => setActionTxStatus({ step: "IDLE" })}
            />
          </div>

          {/* Underwriter & Solvency Notes */}
          {policy && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-2 text-xs text-slate-400">
              <div className="font-semibold text-slate-200 font-mono">
                Pool #{policy.id} Liquidity Status
              </div>
              <div className="flex justify-between font-mono">
                <span>Total Escrow Pool:</span>
                <span className="text-white font-bold">{formatWeiAmount(policy.total_escrow_pool)}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span>Active Claims:</span>
                <span className="text-slate-300">{policy.active_claims_count}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Magistrate Consensus Verdict & Ruling Receipt */}
      {verdict && bpsMath && (
        <div className="rounded-3xl border border-court-amber/50 bg-gradient-to-br from-court-midnight via-slate-900 to-slate-950 p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <GavelIcon className="h-7 w-7 text-court-amber" />
              <div>
                <h2 className="text-xl font-extrabold text-white font-serif">
                  AI Magistrate Consensus Ruling Receipt
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  Verdict ID #{verdict.id} - Ruled at {new Date(verdict.ruled_at * 1000).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="px-4 py-1.5 rounded-full font-mono text-sm font-bold border border-court-amber bg-court-amber/20 text-court-amber">
              {verdict.canonical_verdict} ({(verdict.settlement_bps / 100).toFixed(2)}%)
            </div>
          </div>

          {/* BPS Slider Visualizer */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Proportional Indemnity Settlement:</span>
              <span className="font-bold text-amber-300">
                {verdict.settlement_bps} / 10,000 BPS ({(verdict.settlement_bps / 100).toFixed(2)}%)
              </span>
            </div>
            <div className="h-4 w-full rounded-full bg-slate-800 overflow-hidden p-0.5 border border-slate-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-1000"
                style={{ width: `${Math.min(Math.max(verdict.settlement_bps / 100, 0), 100)}%` }}
              />
            </div>
          </div>

          {/* Criteria Count Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-3">
              <div className="text-lg font-bold font-mono text-emerald-400">
                {verdict.covered_criteria_count}
              </div>
              <div className="text-[11px] font-mono text-emerald-300 uppercase">Covered Perils</div>
            </div>
            <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-3">
              <div className="text-lg font-bold font-mono text-red-400">
                {verdict.excluded_criteria_count}
              </div>
              <div className="text-[11px] font-mono text-red-300 uppercase">Excluded Deductions</div>
            </div>
            <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-3">
              <div className="text-lg font-bold font-mono text-amber-400">
                {verdict.partial_criteria_count}
              </div>
              <div className="text-[11px] font-mono text-amber-300 uppercase">Partial Allowances</div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
              <div className="text-lg font-bold font-mono text-slate-300">
                {verdict.undetermined_criteria_count}
              </div>
              <div className="text-[11px] font-mono text-slate-400 uppercase">Undetermined</div>
            </div>
          </div>

          {/* Ruling Explanations */}
          <div className="space-y-4 text-xs">
            <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-4 space-y-1">
              <div className="font-mono uppercase text-slate-400 font-semibold">Magistrate Ruling Summary</div>
              <p className="text-slate-200 text-sm leading-relaxed">{verdict.ruling_summary}</p>
            </div>

            {verdict.calculation_breakdown && (
              <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-4 space-y-1">
                <div className="font-mono uppercase text-slate-400 font-semibold">Mathematical Breakdown</div>
                <p className="text-slate-300 font-mono">{verdict.calculation_breakdown}</p>
              </div>
            )}

            {verdict.evidence_verification_note && (
              <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-4 space-y-1">
                <div className="font-mono uppercase text-slate-400 font-semibold">Evidence Verification Note</div>
                <p className="text-slate-300 font-mono">{verdict.evidence_verification_note}</p>
              </div>
            )}
          </div>

          {/* Exact Value Conservation Invariant */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-4 text-xs font-mono text-slate-300 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <ShieldCheckIcon className="h-4 w-4" />
              Exact Value Conservation Verified on GenLayer
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400">
              <div>Claimant Total Disbursed: <span className="text-white font-bold">{bpsMath.claimantTotalPayout.toString()} wei</span></div>
              <div>Insurer Pool Retained: <span className="text-white font-bold">{bpsMath.insurerRetained.toString()} wei</span></div>
              <div>Underwriter Refund: <span className="text-white font-bold">{bpsMath.underwriterRefund.toString()} wei</span></div>
              <div>Invariant: <span className="text-emerald-300">indemnity_share + insurer_retained == claimed_amount</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <ContestModal
        claim={claim}
        isOpen={isContestOpen}
        onClose={() => setIsContestOpen(false)}
        onSuccess={() => loadClaimDetails()}
      />

      <DefenseModal
        claim={claim}
        isOpen={isDefenseOpen}
        onClose={() => setIsDefenseOpen(false)}
        onSuccess={() => loadClaimDetails()}
      />

      <AdjudicateModal
        claim={claim}
        isOpen={isAdjudicateOpen}
        onClose={() => setIsAdjudicateOpen(false)}
        onSuccess={() => loadClaimDetails()}
      />
    </div>
  );
}
