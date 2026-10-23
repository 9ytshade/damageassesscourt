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
  const [now, setNow] = useState<number>(0);

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Math.floor(Date.now() / 1000));
    void loadClaimDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claimId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-[1536px] w-full px-5 sm:px-8 lg:px-12 py-16">
        <div className="rounded-3xl border border-[#22242c] bg-[#141519]/70 p-20 text-center font-mono text-sm text-[#9ea3b2] animate-pulse">
          Loading damage claim dossier #{claimId} from GenLayer Studionet...
        </div>
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="mx-auto max-w-[1536px] w-full px-5 sm:px-8 lg:px-12 py-16">
        <div className="rounded-3xl border border-rose-900/50 bg-rose-950/20 p-12 text-center text-rose-300 font-mono text-sm">
          Claim #{claimId} was not found on-chain.
        </div>
      </div>
    );
  }

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
    <div className="w-full pb-20 space-y-10 animate-fade-in">
      {/* Full-Width Top Header Banner matching Landing Page */}
      <section className="relative w-full border-b border-[#22242c] bg-[#000000] py-12 lg:py-16">
        <div className="mx-auto max-w-[1536px] w-full px-5 sm:px-8 lg:px-12 space-y-4">
          <div className="flex items-center gap-2 text-sm font-mono text-[#8a8f9c]">
            <Link href="/claims" className="hover:text-white transition-colors">
              &larr; Claims Docket
            </Link>
            <span>/</span>
            <span className="text-white">Dossier #{claim.id}</span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="px-3.5 py-1.5 rounded-full font-mono text-xs font-bold border border-[#2d2f38] bg-[#1a1b22] text-white">
                Claim Dossier #{claim.id}
              </span>
              <span
                className={`px-3.5 py-1.5 rounded-full font-mono text-xs uppercase tracking-wider font-semibold border ${
                  claim.status === "approved" || claim.status === "resolved"
                    ? "border-emerald-500/40 bg-emerald-950/20 text-emerald-300"
                    : claim.status === "contested" || claim.status === "defended"
                    ? "border-amber-500/40 bg-amber-950/20 text-amber-300"
                    : claim.status === "rejected_slashed"
                    ? "border-rose-500/40 bg-rose-950/20 text-rose-300"
                    : "border-[#333644] bg-[#1a1b22] text-[#d8dbe4]"
                }`}
              >
                Status: {claim.status.replace("_", " ")}
              </span>
            </div>

            <div className="text-xs text-[#8a8f9d] font-mono">
              Filed: {new Date(claim.submitted_at * 1000).toLocaleString()}
            </div>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white font-mono">
            {claim.damage_title}
          </h1>

          <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-[#9ea3b2] font-mono pt-3 border-t border-[#22242c]">
            <div>
              Claimant:{" "}
              <span className="text-[#f0f2f5] font-semibold">{formatAddress(claim.claimant)}</span>
              {isClaimant && <span className="ml-1 text-white font-bold">(You)</span>}
            </div>

            {policy && (
              <div>
                Risk Pool:{" "}
                <Link
                  href={`/policies`}
                  className="text-white hover:underline inline-flex items-center gap-1.5 font-semibold"
                >
                  <BuildingOfficeIcon className="h-3.5 w-3.5 text-[#9ea3b2]" />
                  Pool #{policy.id} ({policy.title.slice(0, 30)}...)
                </Link>
                {isUnderwriter && <span className="ml-1.5 text-emerald-400 font-bold">(Underwriter)</span>}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content Area matching 1536px wide grid */}
      <div className="mx-auto max-w-[1536px] w-full px-5 sm:px-8 lg:px-12 space-y-8">
        {/* Financial Stakes & Liability Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
          <div className="rounded-2xl border border-[#22242c] bg-[#141519]/70 p-5">
            <div className="text-xs uppercase font-mono text-[#8a8f9d]">Claimed Indemnity</div>
            <div className="mt-2 text-2xl font-bold text-white font-mono">
              {formatWeiAmount(claim.claimed_amount)}
            </div>
            <div className="text-xs text-[#8a8f9d] mt-1.5">Requested contractor payout</div>
          </div>

          <div className="rounded-2xl border border-[#22242c] bg-[#141519]/70 p-5">
            <div className="text-xs uppercase font-mono text-[#8a8f9d]">Claimant Anti-Spam Stake</div>
            <div className="mt-2 text-2xl font-bold text-[#f0f2f5] font-mono">
              {formatWeiAmount(claim.claimant_stake)}
            </div>
            <div className="text-xs text-[#8a8f9d] mt-1.5">Locked during adjudication</div>
          </div>

          <div className="rounded-2xl border border-[#22242c] bg-[#141519]/70 p-5">
            <div className="text-xs uppercase font-mono text-[#8a8f9d]">Underwriter Dispute Deposit</div>
            <div className="mt-2 text-2xl font-bold text-[#f0f2f5] font-mono">
              {formatWeiAmount(claim.underwriter_deposit)}
            </div>
            <div className="text-xs text-[#8a8f9d] mt-1.5">Matches stake when contested</div>
          </div>

          <div className="rounded-2xl border border-[#22242c] bg-[#141519]/70 p-5">
            <div className="text-xs uppercase font-mono text-[#8a8f9d]">Adjudication Outcome</div>
            <div
              className={`mt-2 text-2xl font-bold font-mono ${
                verdict ? "text-emerald-400" : "text-[#8a8f9d]"
              }`}
            >
              {verdict ? `${(verdict.settlement_bps / 100).toFixed(2)}% BPS` : "Pending"}
            </div>
            <div className="text-xs text-[#8a8f9d] mt-1.5">
              {verdict ? verdict.canonical_verdict : "Awaiting consensus"}
            </div>
          </div>
        </div>

        {/* Evidence & Damage Narrative */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Damage Narrative */}
            <div className="rounded-3xl border border-[#22242c] bg-[#141519]/70 p-6 sm:p-7 space-y-3.5">
              <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <DocumentTextIcon className="h-5 w-5 text-white" />
                Property Damage Description
              </h3>
              <p className="text-sm text-[#d8dbe4] leading-relaxed whitespace-pre-wrap">
                {claim.damage_description}
              </p>
            </div>

            {/* External Evidence Links */}
            <div className="rounded-3xl border border-[#22242c] bg-[#141519]/70 p-6 sm:p-7 space-y-4">
              <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <ShieldCheckIcon className="h-5 w-5 text-emerald-400" />
                Cryptographic &amp; External Telemetry Evidence
              </h3>

              <div className="space-y-3">
                <div className="rounded-2xl border border-[#22242c] bg-[#0d0e12] p-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#8a8f9d] uppercase">Contractor Repair Estimate (Quote):</span>
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
                    className="text-sm font-mono text-white hover:underline break-all inline-flex items-center gap-1.5"
                  >
                    {claim.repair_estimate_url}
                    <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 flex-shrink-0 text-[#8a8f9d]" />
                  </a>
                </div>

                <div className="rounded-2xl border border-[#22242c] bg-[#0d0e12] p-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#8a8f9d] uppercase">Official NOAA / Weather Proof Report:</span>
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
                    className="text-sm font-mono text-white hover:underline break-all inline-flex items-center gap-1.5"
                  >
                    {claim.incident_proof_url}
                    <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 flex-shrink-0 text-[#8a8f9d]" />
                  </a>
                </div>

                <div className="pt-2 text-xs font-mono text-[#8a8f9d] flex items-center justify-between">
                  <span>Evidence SHA-256 Fingerprint:</span>
                  <span className="text-[#d8dbe4] truncate max-w-[280px] sm:max-w-[400px]">
                    {claim.evidence_hash}
                  </span>
                </div>
              </div>
            </div>

            {/* Underwriter Grievance & Claimant Defense Rebuttal */}
            {(claim.contest_reason || claim.defense_rebuttal) && (
              <div className="rounded-3xl border border-[#22242c] bg-[#141519]/70 p-6 sm:p-7 space-y-4">
                <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                  <GavelIcon className="h-5 w-5 text-white" />
                  Dispute Exclusions &amp; Defense Rebuttal Exchange
                </h3>

                {claim.contest_reason && (
                  <div className="rounded-2xl border border-[#2d2f38] bg-[#0d0e12] p-4 space-y-1.5">
                    <div className="text-xs font-mono font-bold uppercase text-white">
                      Underwriter Contest Grievance:
                    </div>
                    <p className="text-sm text-[#d8dbe4] italic leading-relaxed">
                      &ldquo;{claim.contest_reason}&rdquo;
                    </p>
                  </div>
                )}

                {claim.defense_rebuttal && (
                  <div className="rounded-2xl border border-[#2d2f38] bg-[#0d0e12] p-4 space-y-1.5">
                    <div className="text-xs font-mono font-bold uppercase text-white">
                      Claimant Defense Rebuttal:
                    </div>
                    <p className="text-sm text-[#d8dbe4] italic leading-relaxed">
                      &ldquo;{claim.defense_rebuttal}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar: Procedural Actions & Windows */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-[#22242c] bg-[#141519]/70 p-6 space-y-5">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <ClockIcon className="h-4 w-4 text-white" />
                Court Windows &amp; Actions
              </h3>

              {/* Countdown / Window Indicators */}
              {claim.status === "submitted" && (
                <div className="rounded-2xl border border-[#22242c] bg-[#0d0e12] p-4 space-y-1 text-xs">
                  <div className="flex justify-between font-mono">
                    <span className="text-[#8a8f9d]">Underwriter Review:</span>
                    <span className={isReviewWindowOpen ? "text-white font-semibold" : "text-[#8a8f9d]"}>
                      {isReviewWindowOpen ? "Active Countdown" : "Window Expired"}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#8a8f9d]">
                    Deadline: {new Date(claim.review_deadline * 1000).toLocaleString()}
                  </div>
                </div>
              )}

              {(claim.status === "contested" || claim.status === "defended") && (
                <div className="rounded-2xl border border-[#22242c] bg-[#0d0e12] p-4 space-y-1 text-xs">
                  <div className="flex justify-between font-mono">
                    <span className="text-[#8a8f9d]">Claimant Defense Window:</span>
                    <span className={isDefenseWindowOpen ? "text-white font-semibold" : "text-emerald-400 font-semibold"}>
                      {isDefenseWindowOpen ? "Defense Active" : "Ready for Trial"}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#8a8f9d]">
                    {claim.defense_deadline > 0
                      ? `Deadline: ${new Date(claim.defense_deadline * 1000).toLocaleString()}`
                      : "Window waived by claimant."}
                  </div>
                </div>
              )}

              {/* Action Buttons based on roles */}
              <div className="space-y-3 pt-2">
                {/* Underwriter fast-path actions */}
                {isUnderwriter && isReviewWindowOpen && (
                  <>
                    <button
                      onClick={handleFastPathApprove}
                      className="w-full py-2.5 px-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase font-mono tracking-wider transition-colors shadow-md"
                    >
                      Approve Claim (100% Payout)
                    </button>
                    <button
                      onClick={() => setIsContestOpen(true)}
                      className="w-full py-2.5 px-4 rounded-full border border-[#2d2f38] bg-[#1a1b22] hover:bg-[#252732] text-white font-bold text-xs uppercase font-mono tracking-wider transition-colors"
                    >
                      Contest Claim (Grievance &amp; Deposit)
                    </button>
                  </>
                )}

                {/* Claimant uncontested payout */}
                {isClaimant && isReviewWindowExpired && (
                  <button
                    onClick={handleClaimUncontestedPayout}
                    className="w-full py-2.5 px-4 rounded-full bg-white hover:bg-[#e4e7ee] text-black font-bold text-xs uppercase font-mono tracking-wider transition-colors shadow-md"
                  >
                    Claim Uncontested Payout
                  </button>
                )}

                {/* Claimant defense rebuttal */}
                {isClaimant && isDefenseWindowOpen && (
                  <button
                    onClick={() => setIsDefenseOpen(true)}
                    className="w-full py-2.5 px-4 rounded-full bg-white hover:bg-[#e4e7ee] text-black font-bold text-xs uppercase font-mono tracking-wider transition-colors shadow-md"
                  >
                    Submit Defense Rebuttal
                  </button>
                )}

                {/* AI Magistrate Adjudication Trigger */}
                {isReadyForAdjudication && (
                  <button
                    onClick={() => setIsAdjudicateOpen(true)}
                    className="btn-pill-primary w-full py-3 px-4 text-xs uppercase font-mono tracking-wider flex items-center justify-center gap-2"
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
                      className="w-full py-2.5 px-4 rounded-full border border-rose-500/50 bg-rose-950/20 hover:bg-rose-950 text-rose-300 font-bold text-xs uppercase font-mono tracking-wider transition-colors"
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
              <div className="rounded-3xl border border-[#22242c] bg-[#141519]/70 p-6 space-y-2.5 text-xs text-[#8a8f9d]">
                <div className="font-semibold text-white font-mono">
                  Pool #{policy.id} Liquidity Status
                </div>
                <div className="flex justify-between font-mono">
                  <span>Total Escrow Pool:</span>
                  <span className="text-white font-bold">{formatWeiAmount(policy.total_escrow_pool)}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span>Active Claims:</span>
                  <span className="text-[#d8dbe4]">{policy.active_claims_count}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Magistrate Consensus Verdict & Ruling Receipt */}
        {verdict && bpsMath && (
          <div className="rounded-3xl border border-[#2d2f38] bg-[#121317] p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#22242c]">
              <div className="flex items-center gap-3">
                <GavelIcon className="h-6 w-6 text-white" />
                <div>
                  <h2 className="text-xl font-extrabold text-white font-mono">
                    AI Magistrate Consensus Ruling Receipt
                  </h2>
                  <p className="text-xs text-[#8a8f9d] font-mono">
                    Verdict ID #{verdict.id} - Ruled at {new Date(verdict.ruled_at * 1000).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="px-4 py-1.5 rounded-full font-mono text-sm font-bold border border-[#2d2f38] bg-[#1a1b22] text-white">
                {verdict.canonical_verdict} ({(verdict.settlement_bps / 100).toFixed(2)}%)
              </div>
            </div>

            {/* BPS Slider Visualizer */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#8a8f9d]">Proportional Indemnity Settlement:</span>
                <span className="font-bold text-white">
                  {verdict.settlement_bps} / 10,000 BPS ({(verdict.settlement_bps / 100).toFixed(2)}%)
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-[#1a1b22] overflow-hidden p-0.5 border border-[#2d2f38]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#8a8f9d] to-white transition-all duration-1000"
                  style={{ width: `${Math.min(Math.max(verdict.settlement_bps / 100, 0), 100)}%` }}
                />
              </div>
            </div>

            {/* Criteria Count Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="rounded-2xl border border-emerald-900/50 bg-emerald-950/20 p-3.5">
                <div className="text-xl font-bold font-mono text-emerald-400">
                  {verdict.covered_criteria_count}
                </div>
                <div className="text-[11px] font-mono text-emerald-300 uppercase">Covered Perils</div>
              </div>
              <div className="rounded-2xl border border-rose-900/50 bg-rose-950/20 p-3.5">
                <div className="text-xl font-bold font-mono text-rose-400">
                  {verdict.excluded_criteria_count}
                </div>
                <div className="text-[11px] font-mono text-rose-300 uppercase">Excluded Deductions</div>
              </div>
              <div className="rounded-2xl border border-[#2d2f38] bg-[#1a1b22] p-3.5">
                <div className="text-xl font-bold font-mono text-white">
                  {verdict.partial_criteria_count}
                </div>
                <div className="text-[11px] font-mono text-[#9ea3b2] uppercase">Partial Allowances</div>
              </div>
              <div className="rounded-2xl border border-[#22242c] bg-[#141519] p-3.5">
                <div className="text-xl font-bold font-mono text-[#8a8f9d]">
                  {verdict.undetermined_criteria_count}
                </div>
                <div className="text-[11px] font-mono text-[#8a8f9d] uppercase">Undetermined</div>
              </div>
            </div>

            {/* Ruling Explanations */}
            <div className="space-y-4 text-xs">
              <div className="rounded-2xl bg-[#0d0e12] border border-[#22242c] p-4 space-y-1">
                <div className="font-mono uppercase text-[#8a8f9d] font-semibold">Magistrate Ruling Summary</div>
                <p className="text-[#f0f2f5] text-sm leading-relaxed">{verdict.ruling_summary}</p>
              </div>

              {verdict.calculation_breakdown && (
                <div className="rounded-2xl bg-[#0d0e12] border border-[#22242c] p-4 space-y-1">
                  <div className="font-mono uppercase text-[#8a8f9d] font-semibold">Mathematical Breakdown</div>
                  <p className="text-[#d8dbe4] font-mono text-xs">{verdict.calculation_breakdown}</p>
                </div>
              )}

              {verdict.evidence_verification_note && (
                <div className="rounded-2xl bg-[#0d0e12] border border-[#22242c] p-4 space-y-1">
                  <div className="font-mono uppercase text-[#8a8f9d] font-semibold">Evidence Verification Note</div>
                  <p className="text-[#d8dbe4] font-mono text-xs">{verdict.evidence_verification_note}</p>
                </div>
              )}
            </div>

            {/* Exact Value Conservation Invariant */}
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/10 p-5 text-xs font-mono text-[#d8dbe4] space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <ShieldCheckIcon className="h-4 w-4" />
                Exact Value Conservation Verified on GenLayer
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#9ea3b2]">
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
    </div>
  );
}
