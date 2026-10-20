export type PolicyStatus = "active" | "archived";

export type ClaimStatus =
  | "submitted"
  | "approved"
  | "contested"
  | "defended"
  | "resolved"
  | "rejected_slashed"
  | "exhausted";

export type CanonicalVerdict =
  | "FULL_INDEMNITY"
  | "PARTIAL_SETTLEMENT"
  | "CLAIM_DENIED"
  | "FRAUD_SLASHED"
  | "UNDETERMINED";

export interface PolicyPool {
  id: number;
  underwriter: string;
  title: string;
  description: string;
  policy_terms: string;
  total_escrow_pool: number | string;
  max_claim_cap: number | string;
  max_claim_limit?: number | string;
  min_claimant_stake: number | string;
  review_window_seconds: number;
  defense_window_seconds: number;
  status: PolicyStatus;
  is_active: boolean;
  active_claims_count: number;
  settled_claims_count: number;
  total_payout_disbursed: number | string;
  created_at: number;
}

export interface Claim {
  id: number;
  policy_id: number;
  claimant: string;
  damage_title: string;
  damage_description: string;
  repair_estimate_url: string;
  incident_proof_url: string;
  evidence_hash: string;
  claimed_amount: number | string;
  claimant_stake: number | string;
  underwriter_deposit: number | string;
  status: ClaimStatus;
  contest_reason: string;
  defense_rebuttal: string;
  attempt_count: number;
  verdict_id: number;
  submitted_at: number;
  review_deadline: number;
  defense_deadline: number;
  resolved_at: number;
}

export interface Verdict {
  id: number;
  claim_id: number;
  policy_id: number;
  canonical_verdict: CanonicalVerdict;
  settlement_bps: number;
  covered_criteria_count: number;
  excluded_criteria_count: number;
  partial_criteria_count: number;
  undetermined_criteria_count: number;
  ruling_summary: string;
  calculation_breakdown: string;
  evidence_verification_note: string;
  ruled_at: number;
}

export type TxStep = "IDLE" | "PREPARING" | "AWAITING_SIGNATURE" | "PENDING" | "ACCEPTED" | "FINALIZED" | "ERROR";

export interface TxStatus {
  step: TxStep;
  txHash?: string;
  message?: string;
  error?: string;
}

export interface BpsSettlementCalculation {
  claimedAmount: bigint;
  settlementBps: number;
  indemnityShare: bigint;
  insurerRetained: bigint;
  claimantStake: bigint;
  underwriterDeposit: bigint;
  claimantTotalPayout: bigint;
  underwriterRefund: bigint;
  poolRemainingDelta: bigint;
}
