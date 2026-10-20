# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

"""DamageAssessCourt: Complex Insurance Damage Court & Autonomous Indemnity Protocol on GenLayer.

Formal Invariants & Architecture:
- Underwriters sponsor criteria-governed policy escrow pools with defined perils and exclusion clauses.
- Claimants file damage claims by staking an anti-spam deposit and providing repair estimates and incident logs.
- Insurers possess a bounded review window to fast-path approve or contest claims with specific exclusion grievances.
- Contested claims grant claimants a guaranteed defense window to submit rebuttals and counter-evidence.
- GenLayer validator magistrates non-deterministically retrieve external evidence and interpret policy wording under the Equivalence Principle.
- Consensus is enforced across decision-critical criteria counts, canonical verdicts, and continuous settlement Basis Points (0-10,000 BPS).
- Proportional indemnity payouts conserve exact funds with zero balance leakage.
- Slashing safeguards protect honest claimants from forfeiting stakes on legitimate coverage disputes, slashing stakes only upon proven fraud or forgery.
- Bounded terminal recovery prevents indefinite capital lockup during upstream network outages.
"""

from dataclasses import dataclass
from datetime import datetime, timezone
import hashlib
import ipaddress
import json
from typing import Any
from urllib.parse import urlparse

import genlayer as gl
from genlayer import *


@gl.evm.contract_interface
class _Recipient:
    class View:
        pass

    class Write:
        pass


@allow_storage
@dataclass
class PolicyPool:
    id: u256
    underwriter: Address
    title: str
    description: str
    policy_terms: str
    total_escrow_pool: u256
    max_claim_cap: u256
    min_claimant_stake: u256
    review_window_seconds: u64
    defense_window_seconds: u64
    status: str
    active_claims_count: u32
    settled_claims_count: u32
    total_payout_disbursed: u256
    created_at: u64


@allow_storage
@dataclass
class Claim:
    id: u256
    policy_id: u256
    claimant: Address
    damage_title: str
    damage_description: str
    repair_estimate_url: str
    incident_proof_url: str
    evidence_hash: str
    claimed_amount: u256
    claimant_stake: u256
    underwriter_deposit: u256
    status: str
    contest_reason: str
    defense_rebuttal: str
    attempt_count: u32
    verdict_id: u32
    submitted_at: u64
    review_deadline: u64
    defense_deadline: u64
    resolved_at: u64


@allow_storage
@dataclass
class Verdict:
    id: u32
    claim_id: u256
    policy_id: u256
    canonical_verdict: str
    settlement_bps: u16
    covered_criteria_count: u8
    excluded_criteria_count: u8
    partial_criteria_count: u8
    undetermined_criteria_count: u8
    ruling_summary: str
    calculation_breakdown: str
    evidence_verification_note: str
    ruled_at: u64


class DamageAssessCourt(gl.Contract):
    VERSION = "1.0.0"

    STATUS_ACTIVE = "active"
    STATUS_ARCHIVED = "archived"

    STATUS_SUBMITTED = "submitted"
    STATUS_APPROVED = "approved"
    STATUS_CONTESTED = "contested"
    STATUS_DEFENDED = "defended"
    STATUS_RESOLVED = "resolved"
    STATUS_REJECTED_SLASHED = "rejected_slashed"
    STATUS_EXHAUSTED = "exhausted"

    VERDICT_FULL_INDEMNITY = "FULL_INDEMNITY"
    VERDICT_PARTIAL_SETTLEMENT = "PARTIAL_SETTLEMENT"
    VERDICT_CLAIM_DENIED = "CLAIM_DENIED"
    VERDICT_FRAUD_SLASHED = "FRAUD_SLASHED"
    VERDICT_UNDETERMINED = "UNDETERMINED"

    MAX_BPS = 10_000

    MIN_TITLE_LENGTH = 3
    MAX_TITLE_LENGTH = 120
    MIN_DESCRIPTION_LENGTH = 20
    MAX_DESCRIPTION_LENGTH = 5_000
    MIN_TERMS_LENGTH = 20
    MAX_TERMS_LENGTH = 10_000

    MIN_DAMAGE_TITLE_LENGTH = 3
    MAX_DAMAGE_TITLE_LENGTH = 140
    MIN_DAMAGE_DESC_LENGTH = 20
    MAX_DAMAGE_DESC_LENGTH = 5_000

    MIN_GRIEVANCE_LENGTH = 20
    MAX_GRIEVANCE_LENGTH = 3_000
    MIN_REBUTTAL_LENGTH = 20
    MAX_REBUTTAL_LENGTH = 3_000

    MAX_URL_LENGTH = 2_048
    MAX_EVIDENCE_BODY_CHARS = 25_000

    MIN_REVIEW_WINDOW_SECONDS = 60
    MIN_DEFENSE_WINDOW_SECONDS = 60

    MAX_RETRY_ATTEMPTS = 5
    RETRY_COOLDOWN_SECONDS = 30
    EXHAUSTION_TIMEOUT_SECONDS = 86_400

    policy_pool_count: u256
    claim_count: u256
    verdict_count: u32

    policy_pools: TreeMap[u256, PolicyPool]
    claims: TreeMap[u256, Claim]
    verdicts: TreeMap[u32, Verdict]
    rewarded_evidence: TreeMap[str, bool]
    active_evidence: TreeMap[str, bool]

    def __init__(self):
        self.policy_pool_count = u256(0)
        self.claim_count = u256(0)
        self.verdict_count = u32(0)

    # -------------------------------------------------------------
    # Internal Validation & Accounting Utilities
    # -------------------------------------------------------------

    def _now(self) -> u64:
        return u64(int(datetime.now(timezone.utc).timestamp()))

    def _require_policy_pool(self, policy_id: u256) -> PolicyPool:
        if policy_id not in self.policy_pools:
            raise gl.vm.UserError("Policy pool not found")
        return self.policy_pools[policy_id]

    def _require_claim(self, claim_id: u256) -> Claim:
        if claim_id not in self.claims:
            raise gl.vm.UserError("Claim not found")
        return self.claims[claim_id]

    def _sanitize_prompt_text(self, text: str) -> str:
        return text.replace("</", "< /")

    def _evidence_key(self, policy_id: u256, url: str) -> str:
        clean = url.strip().lower()
        return f"{policy_id}:{clean}"

    def _validate_https_url(self, url: str) -> str:
        clean = url.strip()
        if not clean.startswith("https://"):
            raise gl.vm.UserError("Evidence URL must use public HTTPS")
        if len(clean) > self.MAX_URL_LENGTH:
            raise gl.vm.UserError("Evidence URL is too long")
        if any(c in clean for c in (" ", "\r", "\n", "\t")):
            raise gl.vm.UserError("Evidence URL contains invalid whitespace")

        try:
            parsed = urlparse(clean)
        except Exception:
            raise gl.vm.UserError("Invalid evidence URL format")

        if parsed.scheme.lower() != "https":
            raise gl.vm.UserError("Evidence URL must use HTTPS scheme")

        host = (parsed.hostname or "").lower()
        if not host:
            raise gl.vm.UserError("Evidence URL must include a valid hostname")

        if parsed.port is not None and parsed.port != 443:
            raise gl.vm.UserError("Non-standard ports are prohibited for security")

        blocked_hosts = {
            "localhost",
            "127.0.0.1",
            "0.0.0.0",
            "169.254.169.254",
            "metadata.google.internal",
            "instance-data",
        }
        if host in blocked_hosts or host.endswith(".local") or host.endswith(".internal"):
            raise gl.vm.UserError("Local and private network URLs are prohibited")

        try:
            ip = ipaddress.ip_address(host)
            if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_multicast or ip.is_reserved:
                raise gl.vm.UserError("Private and reserved IP addresses are prohibited")
        except ValueError:
            pass

        return clean

    def _transfer_out(self, recipient: Address, amount: u256) -> None:
        if amount > u256(0):
            _Recipient(recipient).emit_transfer(value=amount)

    # -------------------------------------------------------------
    # Underwriter & Policy Pool Methods
    # -------------------------------------------------------------

    @gl.public.write.payable
    def create_policy_pool(
        self,
        title: str,
        description: str,
        policy_terms: str,
        max_claim_cap: u256,
        min_claimant_stake: u256,
        review_window_seconds: u64,
        defense_window_seconds: u64,
    ) -> u256:
        clean_title = title.strip()
        clean_desc = description.strip()
        clean_terms = policy_terms.strip()

        if len(clean_title) < self.MIN_TITLE_LENGTH or len(clean_title) > self.MAX_TITLE_LENGTH:
            raise gl.vm.UserError("Title length is invalid")
        if len(clean_desc) < self.MIN_DESCRIPTION_LENGTH or len(clean_desc) > self.MAX_DESCRIPTION_LENGTH:
            raise gl.vm.UserError("Description length is invalid")
        if len(clean_terms) < self.MIN_TERMS_LENGTH or len(clean_terms) > self.MAX_TERMS_LENGTH:
            raise gl.vm.UserError("Policy terms length is invalid")

        initial_escrow = gl.message.value
        if initial_escrow == u256(0):
            raise gl.vm.UserError("Initial policy escrow pool deposit must be greater than zero")
        if max_claim_cap == u256(0) or max_claim_cap > initial_escrow:
            raise gl.vm.UserError("Max claim cap must be greater than zero and <= initial escrow deposit")
        if min_claimant_stake == u256(0):
            raise gl.vm.UserError("Min claimant stake must be greater than zero")
        if review_window_seconds < u64(self.MIN_REVIEW_WINDOW_SECONDS):
            raise gl.vm.UserError("Review window must be at least 60 seconds")
        if defense_window_seconds < u64(self.MIN_DEFENSE_WINDOW_SECONDS):
            raise gl.vm.UserError("Defense window must be at least 60 seconds")

        self.policy_pool_count = self.policy_pool_count + u256(1)
        pool_id = self.policy_pool_count

        pool = PolicyPool(
            id=pool_id,
            underwriter=gl.message.sender_address,
            title=clean_title,
            description=clean_desc,
            policy_terms=clean_terms,
            total_escrow_pool=initial_escrow,
            max_claim_cap=max_claim_cap,
            min_claimant_stake=min_claimant_stake,
            review_window_seconds=review_window_seconds,
            defense_window_seconds=defense_window_seconds,
            status=self.STATUS_ACTIVE,
            active_claims_count=u32(0),
            settled_claims_count=u32(0),
            total_payout_disbursed=u256(0),
            created_at=self._now(),
        )

        self.policy_pools[pool_id] = pool
        return pool_id

    @gl.public.write.payable
    def fund_policy_pool(self, policy_id: u256) -> None:
        pool = self._require_policy_pool(policy_id)
        if pool.status != self.STATUS_ACTIVE:
            raise gl.vm.UserError("Policy pool is not active")
        if gl.message.value == u256(0):
            raise gl.vm.UserError("Deposit value must be greater than zero")

        pool.total_escrow_pool = pool.total_escrow_pool + gl.message.value
        self.policy_pools[policy_id] = pool

    @gl.public.write
    def archive_policy_pool(self, policy_id: u256) -> None:
        pool = self._require_policy_pool(policy_id)
        if gl.message.sender_address != pool.underwriter:
            raise gl.vm.UserError("Only underwriter can archive policy pool")
        if pool.status != self.STATUS_ACTIVE:
            raise gl.vm.UserError("Policy pool is not active")
        if pool.active_claims_count > u32(0):
            raise gl.vm.UserError("Cannot archive policy pool with active unfinalized claims")

        refundable_balance = pool.total_escrow_pool
        pool.total_escrow_pool = u256(0)
        pool.status = self.STATUS_ARCHIVED
        self.policy_pools[policy_id] = pool

        self._transfer_out(pool.underwriter, refundable_balance)

    # -------------------------------------------------------------
    # Claimant Claim Submission & Fast-Path Settlement
    # -------------------------------------------------------------

    @gl.public.write.payable
    def file_claim(
        self,
        policy_id: u256,
        damage_title: str,
        damage_description: str,
        repair_estimate_url: str,
        incident_proof_url: str,
        claimed_amount: u256,
    ) -> u256:
        pool = self._require_policy_pool(policy_id)
        if pool.status != self.STATUS_ACTIVE:
            raise gl.vm.UserError("Policy pool is not active")
        if gl.message.sender_address == pool.underwriter:
            raise gl.vm.UserError("Underwriter cannot file claims against their own policy pool")

        clean_title = damage_title.strip()
        clean_desc = damage_description.strip()
        if len(clean_title) < self.MIN_DAMAGE_TITLE_LENGTH or len(clean_title) > self.MAX_DAMAGE_TITLE_LENGTH:
            raise gl.vm.UserError("Damage title length is invalid")
        if len(clean_desc) < self.MIN_DAMAGE_DESC_LENGTH or len(clean_desc) > self.MAX_DAMAGE_DESC_LENGTH:
            raise gl.vm.UserError("Damage description length is invalid")

        valid_repair_url = self._validate_https_url(repair_estimate_url)
        valid_incident_url = self._validate_https_url(incident_proof_url)

        if claimed_amount == u256(0) or claimed_amount > pool.max_claim_cap:
            raise gl.vm.UserError("Claimed amount must be greater than zero and <= policy max claim cap")
        if pool.total_escrow_pool < claimed_amount:
            raise gl.vm.UserError("Policy pool escrow is insufficient for requested claim amount")

        # Anti-spam stake exact accounting & excess refund
        if gl.message.value < pool.min_claimant_stake:
            raise gl.vm.UserError("Deposit is below minimum required claimant stake")
        excess_stake = gl.message.value - pool.min_claimant_stake
        locked_stake = pool.min_claimant_stake

        # Check duplicate and in-flight evidence
        ev_key = self._evidence_key(policy_id, valid_repair_url)
        if ev_key in self.rewarded_evidence:
            raise gl.vm.UserError("Repair estimate evidence has already been settled and rewarded")
        if ev_key in self.active_evidence:
            raise gl.vm.UserError("Repair estimate evidence is currently active in another claim")

        now_ts = self._now()
        self.claim_count = self.claim_count + u256(1)
        claim_id = self.claim_count

        evidence_fingerprint = hashlib.sha256(
            f"{valid_repair_url}:{valid_incident_url}:{now_ts}".encode()
        ).hexdigest()

        # Deduct claimed amount liability from pool
        pool.total_escrow_pool = pool.total_escrow_pool - claimed_amount
        pool.active_claims_count = pool.active_claims_count + u32(1)
        self.policy_pools[policy_id] = pool

        claim = Claim(
            id=claim_id,
            policy_id=policy_id,
            claimant=gl.message.sender_address,
            damage_title=clean_title,
            damage_description=clean_desc,
            repair_estimate_url=valid_repair_url,
            incident_proof_url=valid_incident_url,
            evidence_hash=evidence_fingerprint,
            claimed_amount=claimed_amount,
            claimant_stake=locked_stake,
            underwriter_deposit=u256(0),
            status=self.STATUS_SUBMITTED,
            contest_reason="",
            defense_rebuttal="",
            attempt_count=u32(0),
            verdict_id=u32(0),
            submitted_at=now_ts,
            review_deadline=now_ts + pool.review_window_seconds,
            defense_deadline=u64(0),
            resolved_at=u64(0),
        )

        self.claims[claim_id] = claim
        self.active_evidence[ev_key] = True

        # Refund any excess stake immediately
        if excess_stake > u256(0):
            self._transfer_out(gl.message.sender_address, excess_stake)

        return claim_id

    @gl.public.write
    def approve_claim(self, claim_id: u256) -> None:
        claim = self._require_claim(claim_id)
        pool = self._require_policy_pool(claim.policy_id)

        if gl.message.sender_address != pool.underwriter:
            raise gl.vm.UserError("Only policy underwriter can approve claims")
        if claim.status != self.STATUS_SUBMITTED:
            raise gl.vm.UserError("Claim is not in submitted review state")

        now_ts = self._now()
        claim.status = self.STATUS_APPROVED
        claim.resolved_at = now_ts
        self.claims[claim_id] = claim

        pool.active_claims_count = pool.active_claims_count - u32(1)
        pool.settled_claims_count = pool.settled_claims_count + u32(1)
        pool.total_payout_disbursed = pool.total_payout_disbursed + claim.claimed_amount
        self.policy_pools[claim.policy_id] = pool

        ev_key = self._evidence_key(claim.policy_id, claim.repair_estimate_url)
        self.rewarded_evidence[ev_key] = True
        if ev_key in self.active_evidence:
            del self.active_evidence[ev_key]

        # Transfer full claim amount + return stake to claimant
        total_payout = claim.claimed_amount + claim.claimant_stake
        self._transfer_out(claim.claimant, total_payout)

    @gl.public.write
    def claim_uncontested_payout(self, claim_id: u256) -> None:
        claim = self._require_claim(claim_id)
        pool = self._require_policy_pool(claim.policy_id)

        if gl.message.sender_address != claim.claimant:
            raise gl.vm.UserError("Only claimant can claim uncontested payout")
        if claim.status != self.STATUS_SUBMITTED:
            raise gl.vm.UserError("Claim is not in submitted review state")

        now_ts = self._now()
        if now_ts < claim.review_deadline:
            raise gl.vm.UserError("Underwriter review window has not yet expired")

        claim.status = self.STATUS_APPROVED
        claim.resolved_at = now_ts
        self.claims[claim_id] = claim

        pool.active_claims_count = pool.active_claims_count - u32(1)
        pool.settled_claims_count = pool.settled_claims_count + u32(1)
        pool.total_payout_disbursed = pool.total_payout_disbursed + claim.claimed_amount
        self.policy_pools[claim.policy_id] = pool

        ev_key = self._evidence_key(claim.policy_id, claim.repair_estimate_url)
        self.rewarded_evidence[ev_key] = True
        if ev_key in self.active_evidence:
            del self.active_evidence[ev_key]

        total_payout = claim.claimed_amount + claim.claimant_stake
        self._transfer_out(claim.claimant, total_payout)

    # -------------------------------------------------------------
    # Contestation & Defense Handshake
    # -------------------------------------------------------------

    @gl.public.write.payable
    def contest_claim(self, claim_id: u256, contest_reason: str) -> None:
        claim = self._require_claim(claim_id)
        pool = self._require_policy_pool(claim.policy_id)

        if gl.message.sender_address != pool.underwriter:
            raise gl.vm.UserError("Only policy underwriter can contest claims")
        if claim.status != self.STATUS_SUBMITTED:
            raise gl.vm.UserError("Claim is not in submitted review state")

        now_ts = self._now()
        if now_ts >= claim.review_deadline:
            raise gl.vm.UserError("Underwriter review window has expired")

        clean_reason = contest_reason.strip()
        if len(clean_reason) < self.MIN_GRIEVANCE_LENGTH or len(clean_reason) > self.MAX_GRIEVANCE_LENGTH:
            raise gl.vm.UserError("Contest grievance length is invalid")

        required_deposit = claim.claimant_stake
        if gl.message.value < required_deposit:
            raise gl.vm.UserError("Underwriter dispute deposit must match claimant stake amount")
        excess_deposit = gl.message.value - required_deposit

        claim.underwriter_deposit = required_deposit
        claim.contest_reason = clean_reason
        claim.defense_deadline = now_ts + pool.defense_window_seconds
        claim.status = self.STATUS_CONTESTED
        self.claims[claim_id] = claim

        if excess_deposit > u256(0):
            self._transfer_out(gl.message.sender_address, excess_deposit)

    @gl.public.write
    def submit_defense(self, claim_id: u256, defense_rebuttal: str, waive_remaining_time: bool) -> None:
        claim = self._require_claim(claim_id)
        if gl.message.sender_address != claim.claimant:
            raise gl.vm.UserError("Only claimant can submit defense rebuttal")
        if claim.status not in (self.STATUS_CONTESTED, self.STATUS_DEFENDED):
            raise gl.vm.UserError("Claim is not in a defendable state")

        now_ts = self._now()
        if now_ts >= claim.defense_deadline:
            raise gl.vm.UserError("Defense window has expired")

        clean_rebuttal = defense_rebuttal.strip()
        if len(clean_rebuttal) < self.MIN_REBUTTAL_LENGTH or len(clean_rebuttal) > self.MAX_REBUTTAL_LENGTH:
            raise gl.vm.UserError("Defense rebuttal length is invalid")

        claim.defense_rebuttal = clean_rebuttal
        if waive_remaining_time:
            claim.defense_deadline = now_ts
        claim.status = self.STATUS_DEFENDED
        self.claims[claim_id] = claim

    @gl.public.write
    def settle_uncontested_claim(self, claim_id: u256) -> None:
        self.claim_uncontested_payout(claim_id)

    @gl.public.write
    def submit_claimant_defense(self, claim_id: u256, defense_rebuttal: str, waive_remaining_time: bool) -> None:
        self.submit_defense(claim_id, defense_rebuttal, waive_remaining_time)

    # -------------------------------------------------------------
    # AI Magistrate Adjudication under Equivalence Principle
    # -------------------------------------------------------------

    def _build_magistrate_prompt(
        self,
        pool: PolicyPool,
        claim: Claim,
        weather_text: str,
        repair_text: str,
    ) -> str:
        safe_policy_terms = self._sanitize_prompt_text(pool.policy_terms)
        safe_damage_desc = self._sanitize_prompt_text(claim.damage_description)
        safe_contest_reason = self._sanitize_prompt_text(claim.contest_reason)
        safe_rebuttal = self._sanitize_prompt_text(claim.defense_rebuttal)
        safe_weather = self._sanitize_prompt_text(weather_text[: self.MAX_EVIDENCE_BODY_CHARS])
        safe_repair = self._sanitize_prompt_text(repair_text[: self.MAX_EVIDENCE_BODY_CHARS])

        prompt = f"""You are an expert autonomous Insurance Damage Court Magistrate operating in consensus on GenLayer.
Your duty is to impartially adjudicate an insurance property damage claim by evaluating policy coverage, exclusion clauses, contractor repair estimates, and official incident/weather logs.

<policy_document id="{pool.id}">
  <title>{pool.title}</title>
  <terms>{safe_policy_terms}</terms>
  <max_cap>{claim.claimed_amount}</max_cap>
</policy_document>

<claim_dossier id="{claim.id}">
  <damage_title>{claim.damage_title}</damage_title>
  <damage_narrative>{safe_damage_desc}</damage_narrative>
  <claimed_amount>{claim.claimed_amount}</claimed_amount>
</claim_dossier>

<dispute_contestation by="underwriter">
  {safe_contest_reason}
</dispute_contestation>

<claimant_defense by="claimant">
  {safe_rebuttal}
</claimant_defense>

<incident_weather_evidence url="{claim.incident_proof_url}">
  {safe_weather}
</incident_weather_evidence>

<contractor_repair_estimate url="{claim.repair_estimate_url}">
  {safe_repair}
</contractor_repair_estimate>

INSTRUCTIONS:
1. Examine the weather/incident log: Did the claimed storm/event occur with severity sufficient to trigger covered perils?
2. Examine the repair estimate: Do the repair line items reflect legitimate covered peril repairs, or do they include pre-existing wear, excluded rust, or cosmetic maintenance?
3. Check for fraud or forgery: Is the estimate completely fabricated, or is the incident non-existent?
4. Determine the fair settlement percentage using continuous Basis Points (0 to 10000 BPS):
   - 10000 BPS: 100% full indemnity payout (all damage covered without exclusions).
   - 1 to 9999 BPS: Proportional partial settlement (covered damage paid; excluded line items/depreciation deducted).
   - 0 BPS: Legitimate total exclusion denial (peril not covered, or exclusively pre-existing damage).
   - If proven fraud/forgery: Output canonical_verdict 'FRAUD_SLASHED' with 0 BPS.
5. Select canonical_verdict:
   - 'FULL_INDEMNITY' (if settlement_bps == 10000)
   - 'PARTIAL_SETTLEMENT' (if 0 < settlement_bps < 10000)
   - 'CLAIM_DENIED' (if settlement_bps == 0 and legitimate policy exclusion)
   - 'FRAUD_SLASHED' (if fraudulent or forged claim)

OUTPUT FORMAT: You MUST return strictly valid JSON matching this exact schema:
{{
  "canonical_verdict": "FULL_INDEMNITY | PARTIAL_SETTLEMENT | CLAIM_DENIED | FRAUD_SLASHED",
  "settlement_bps": <integer 0 to 10000>,
  "covered_criteria_count": <integer 0 to 10>,
  "excluded_criteria_count": <integer 0 to 10>,
  "partial_criteria_count": <integer 0 to 10>,
  "undetermined_criteria_count": <integer 0 to 10>,
  "ruling_summary": "<concise legal and adjuster reasoning>",
  "calculation_breakdown": "<itemized explanation of covered vs excluded line items and BPS derivation>",
  "evidence_verification_note": "<verification summary of weather and repair links>"
}}
"""
        return prompt

    def _normalize_ruling_dict(self, raw: Any) -> dict:
        data = json.loads(raw) if isinstance(raw, str) else dict(raw)
        canonical = str(data.get("canonical_verdict", self.VERDICT_CLAIM_DENIED)).strip()
        if canonical not in (
            self.VERDICT_FULL_INDEMNITY,
            self.VERDICT_PARTIAL_SETTLEMENT,
            self.VERDICT_CLAIM_DENIED,
            self.VERDICT_FRAUD_SLASHED,
        ):
            canonical = self.VERDICT_CLAIM_DENIED

        raw_bps = data.get("settlement_bps", 0)
        try:
            bps_int = int(raw_bps)
        except Exception:
            bps_int = 0
        bps_clamped = min(max(bps_int, 0), self.MAX_BPS)

        if canonical == self.VERDICT_FULL_INDEMNITY:
            bps_clamped = self.MAX_BPS
        elif canonical in (self.VERDICT_CLAIM_DENIED, self.VERDICT_FRAUD_SLASHED):
            bps_clamped = 0

        return {
            "canonical_verdict": canonical,
            "settlement_bps": bps_clamped,
            "covered_criteria_count": int(data.get("covered_criteria_count", 0)),
            "excluded_criteria_count": int(data.get("excluded_criteria_count", 0)),
            "partial_criteria_count": int(data.get("partial_criteria_count", 0)),
            "undetermined_criteria_count": int(data.get("undetermined_criteria_count", 0)),
            "ruling_summary": str(data.get("ruling_summary", "Adjudicated by AI Court Magistrate consensus")),
            "calculation_breakdown": str(data.get("calculation_breakdown", "")),
            "evidence_verification_note": str(data.get("evidence_verification_note", "")),
        }

    def _validate_ruling_agreement(self, leader_val: dict, validator_val: dict) -> bool:
        try:
            if leader_val.get("kind") != validator_val.get("kind"):
                return False

            if leader_val.get("kind") in ("DEAD_LINK", "TRANSIENT_ERROR"):
                return True

            # Consensus requirement 1: Canonical verdict agreement
            if leader_val.get("canonical_verdict") != validator_val.get("canonical_verdict"):
                return False

            # Consensus requirement 2: Criteria counts agreement
            if int(leader_val.get("covered_criteria_count", 0)) != int(validator_val.get("covered_criteria_count", 0)):
                return False
            if int(leader_val.get("excluded_criteria_count", 0)) != int(validator_val.get("excluded_criteria_count", 0)):
                return False
            if int(leader_val.get("partial_criteria_count", 0)) != int(validator_val.get("partial_criteria_count", 0)):
                return False
            if int(leader_val.get("undetermined_criteria_count", 0)) != int(validator_val.get("undetermined_criteria_count", 0)):
                return False

            # Consensus requirement 3: Basis Points agreement
            l_verdict = leader_val.get("canonical_verdict")
            l_bps = int(leader_val.get("settlement_bps", 0))
            v_bps = int(validator_val.get("settlement_bps", 0))
            if l_verdict in (self.VERDICT_FULL_INDEMNITY, self.VERDICT_CLAIM_DENIED, self.VERDICT_FRAUD_SLASHED):
                return l_bps == v_bps
            return abs(l_bps - v_bps) <= 500
        except Exception:
            return False

    @gl.public.write
    def adjudicate_claim(self, claim_id: u256) -> None:
        claim = self._require_claim(claim_id)
        pool = self._require_policy_pool(claim.policy_id)

        if claim.status not in (self.STATUS_CONTESTED, self.STATUS_DEFENDED):
            raise gl.vm.UserError("Claim is not in a disputable state")

        now_ts = self._now()
        if now_ts < claim.defense_deadline:
            raise gl.vm.UserError("Claimant defense window is currently active")

        incident_url = claim.incident_proof_url
        repair_url = claim.repair_estimate_url

        def evaluate() -> dict:
            try:
                weather_res = gl.nondet.web.get(incident_url)
                weather_status = weather_res.status
            except Exception as exc:
                return {
                    "kind": "TRANSIENT_ERROR",
                    "reason": f"Weather evidence connection error: {str(exc)[:150]}",
                }

            try:
                repair_res = gl.nondet.web.get(repair_url)
                repair_status = repair_res.status
            except Exception as exc:
                return {
                    "kind": "TRANSIENT_ERROR",
                    "reason": f"Repair estimate connection error: {str(exc)[:150]}",
                }

            # Fast-path deterministic slashing on dead links (404 / 410)
            if weather_status in (404, 410) or repair_status in (404, 410):
                return {
                    "kind": "DEAD_LINK",
                    "canonical_verdict": self.VERDICT_FRAUD_SLASHED,
                    "settlement_bps": 0,
                    "covered_criteria_count": 0,
                    "excluded_criteria_count": 1,
                    "partial_criteria_count": 0,
                    "undetermined_criteria_count": 0,
                    "ruling_summary": "Claim evidence link returned HTTP 404/410 (Dead or Fabricated Resource)",
                    "calculation_breakdown": "0 BPS - Dead or fabricated evidence link.",
                    "evidence_verification_note": f"Weather status {weather_status}, repair status {repair_status}",
                }

            # Upstream transient server outage safeguard (429 / 5xx)
            if weather_status in (429, 500, 502, 503, 504) or repair_status in (429, 500, 502, 503, 504):
                return {
                    "kind": "TRANSIENT_ERROR",
                    "reason": f"Upstream server unavailable (Weather: {weather_status}, Repair: {repair_status})",
                }

            weather_body = weather_res.body
            if hasattr(weather_body, "decode"):
                weather_text = weather_body.decode("utf-8", errors="replace")
            else:
                weather_text = str(weather_body)

            repair_body = repair_res.body
            if hasattr(repair_body, "decode"):
                repair_text = repair_body.decode("utf-8", errors="replace")
            else:
                repair_text = str(repair_body)

            prompt = self._build_magistrate_prompt(pool, claim, weather_text, repair_text)
            raw_response = gl.nondet.exec_prompt(prompt, response_format="json")

            parsed = self._normalize_ruling_dict(raw_response)
            parsed["kind"] = "RULING"
            return parsed

        def validate(leader_result: gl.vm.Result) -> bool:
            if not isinstance(leader_result, gl.vm.Return):
                return False
            try:
                leader_val = leader_result.calldata
                if not isinstance(leader_val, dict):
                    return False
                validator_val = evaluate()
                return self._validate_ruling_agreement(leader_val, validator_val)
            except Exception:
                return False

        ruling = gl.vm.run_nondet_unsafe(evaluate, validate)

        if ruling.get("kind") == "TRANSIENT_ERROR":
            claim.attempt_count = claim.attempt_count + u32(1)
            self.claims[claim_id] = claim
            return

        if ruling.get("kind") == "DEAD_LINK":
            self._settle_fraud_slashed(pool, claim, ruling.get("ruling_summary", "Dead or fabricated evidence link"))
            return

        self._execute_settlement(pool, claim, ruling)

    def _settle_fraud_slashed(self, pool: PolicyPool, claim: Claim, reason: str) -> None:
        now_ts = self._now()
        self.verdict_count = self.verdict_count + u32(1)
        verdict_id = self.verdict_count

        verdict = Verdict(
            id=verdict_id,
            claim_id=claim.id,
            policy_id=pool.id,
            canonical_verdict=self.VERDICT_FRAUD_SLASHED,
            settlement_bps=0,
            covered_criteria_count=u8(0),
            excluded_criteria_count=u8(1),
            partial_criteria_count=u8(0),
            undetermined_criteria_count=u8(0),
            ruling_summary=reason,
            calculation_breakdown="0 BPS - Fraudulent evidence. Claimant stake forfeited.",
            evidence_verification_note=reason,
            ruled_at=now_ts,
        )
        self.verdicts[verdict_id] = verdict

        claim.status = self.STATUS_REJECTED_SLASHED
        claim.verdict_id = verdict_id
        claim.resolved_at = now_ts
        self.claims[claim.id] = claim

        # Slashed stake + claimed amount returned to pool
        pool.total_escrow_pool = pool.total_escrow_pool + claim.claimed_amount + claim.claimant_stake
        pool.active_claims_count = pool.active_claims_count - u32(1)
        self.policy_pools[pool.id] = pool

        ev_key = self._evidence_key(pool.id, claim.repair_estimate_url)
        if ev_key in self.active_evidence:
            del self.active_evidence[ev_key]

        # Refund underwriter dispute deposit
        self._transfer_out(pool.underwriter, claim.underwriter_deposit)

    def _execute_settlement(self, pool: PolicyPool, claim: Claim, ruling: dict) -> None:
        parsed = ruling
        canonical = parsed.get("canonical_verdict", self.VERDICT_CLAIM_DENIED)
        raw_bps = int(parsed.get("settlement_bps", 0))
        settlement_bps = min(max(raw_bps, 0), self.MAX_BPS)

        now_ts = self._now()
        self.verdict_count = self.verdict_count + u32(1)
        verdict_id = self.verdict_count

        verdict = Verdict(
            id=verdict_id,
            claim_id=claim.id,
            policy_id=pool.id,
            canonical_verdict=canonical,
            settlement_bps=settlement_bps,
            covered_criteria_count=u8(parsed.get("covered_criteria_count", 0)),
            excluded_criteria_count=u8(parsed.get("excluded_criteria_count", 0)),
            partial_criteria_count=u8(parsed.get("partial_criteria_count", 0)),
            undetermined_criteria_count=u8(parsed.get("undetermined_criteria_count", 0)),
            ruling_summary=parsed.get("ruling_summary", "Adjudicated by validator consensus"),
            calculation_breakdown=parsed.get("calculation_breakdown", ""),
            evidence_verification_note=parsed.get("evidence_verification_note", ""),
            ruled_at=now_ts,
        )
        self.verdicts[verdict_id] = verdict

        claim.verdict_id = verdict_id
        claim.resolved_at = now_ts

        # Exact Proportional Basis Points Math
        indemnity_share = (claim.claimed_amount * u256(settlement_bps)) // u256(self.MAX_BPS)
        insurer_retained = claim.claimed_amount - indemnity_share

        pool.active_claims_count = pool.active_claims_count - u32(1)
        ev_key = self._evidence_key(pool.id, claim.repair_estimate_url)
        if ev_key in self.active_evidence:
            del self.active_evidence[ev_key]

        if canonical == self.VERDICT_FRAUD_SLASHED or (settlement_bps == 0 and "fraud" in parsed.get("ruling_summary", "").lower()):
            # Fraudulent claim: Slashed stake into pool, full claim liability retained in pool
            claim.status = self.STATUS_REJECTED_SLASHED
            self.claims[claim.id] = claim

            pool.total_escrow_pool = pool.total_escrow_pool + claim.claimed_amount + claim.claimant_stake
            self.policy_pools[pool.id] = pool

            self._transfer_out(pool.underwriter, claim.underwriter_deposit)
            return

        # Honest claim outcome (Full indemnity, partial settlement, or legitimate exclusion denial)
        claim.status = self.STATUS_RESOLVED
        self.claims[claim.id] = claim

        if indemnity_share > u256(0):
            pool.settled_claims_count = pool.settled_claims_count + u32(1)
            pool.total_payout_disbursed = pool.total_payout_disbursed + indemnity_share
            self.rewarded_evidence[ev_key] = True

        if insurer_retained > u256(0):
            pool.total_escrow_pool = pool.total_escrow_pool + insurer_retained

        self.policy_pools[pool.id] = pool

        if settlement_bps == self.MAX_BPS:
            # Full Indemnity: Claimant receives 100% claim + stake returned + underwriter deposit
            claimant_total = indemnity_share + claim.claimant_stake + claim.underwriter_deposit
            self._transfer_out(claim.claimant, claimant_total)
        else:
            # Partial or Legitimate Exclusion:
            # Claimant receives proportional indemnity + stake returned (slashing safeguard)
            # Underwriter receives dispute deposit returned
            claimant_total = indemnity_share + claim.claimant_stake
            self._transfer_out(claim.claimant, claimant_total)
            self._transfer_out(pool.underwriter, claim.underwriter_deposit)

    # -------------------------------------------------------------
    # Terminal Liveness & Outage Recovery
    # -------------------------------------------------------------

    @gl.public.write
    def resolve_exhausted_claim(self, claim_id: u256) -> None:
        claim = self._require_claim(claim_id)
        pool = self._require_policy_pool(claim.policy_id)

        if claim.status not in (self.STATUS_CONTESTED, self.STATUS_DEFENDED):
            raise gl.vm.UserError("Claim is not in an unresolved dispute state")

        now_ts = self._now()
        is_attempts_exhausted = claim.attempt_count >= u32(self.MAX_RETRY_ATTEMPTS)
        is_timeout_exhausted = (now_ts - claim.submitted_at) >= u64(self.EXHAUSTION_TIMEOUT_SECONDS)

        if not (is_attempts_exhausted or is_timeout_exhausted):
            raise gl.vm.UserError("Claim has not met exhaustion criteria (5 attempts or 86,400s timeout)")

        claim.status = self.STATUS_EXHAUSTED
        claim.resolved_at = now_ts
        self.claims[claim_id] = claim

        # Restore uncommitted liability back to policy pool
        pool.total_escrow_pool = pool.total_escrow_pool + claim.claimed_amount
        pool.active_claims_count = pool.active_claims_count - u32(1)
        self.policy_pools[pool.id] = pool

        ev_key = self._evidence_key(pool.id, claim.repair_estimate_url)
        if ev_key in self.active_evidence:
            del self.active_evidence[ev_key]

        # 100% Refund claimant stake and underwriter deposit
        self._transfer_out(claim.claimant, claim.claimant_stake)
        self._transfer_out(pool.underwriter, claim.underwriter_deposit)

    # -------------------------------------------------------------
    # Public View Methods
    # -------------------------------------------------------------

    @gl.public.view
    def get_policy_pool(self, policy_id: u256) -> dict:
        pool = self._require_policy_pool(policy_id)
        return {
            "id": int(pool.id),
            "underwriter": str(pool.underwriter),
            "title": pool.title,
            "description": pool.description,
            "policy_terms": pool.policy_terms,
            "total_escrow_pool": int(pool.total_escrow_pool),
            "max_claim_cap": int(pool.max_claim_cap),
            "max_claim_limit": int(pool.max_claim_cap),
            "min_claimant_stake": int(pool.min_claimant_stake),
            "review_window_seconds": int(pool.review_window_seconds),
            "defense_window_seconds": int(pool.defense_window_seconds),
            "status": pool.status,
            "is_active": pool.status == self.STATUS_ACTIVE,
            "active_claims_count": int(pool.active_claims_count),
            "settled_claims_count": int(pool.settled_claims_count),
            "total_payout_disbursed": int(pool.total_payout_disbursed),
            "created_at": int(pool.created_at),
        }

    @gl.public.view
    def get_claim(self, claim_id: u256) -> dict:
        claim = self._require_claim(claim_id)
        return {
            "id": int(claim.id),
            "policy_id": int(claim.policy_id),
            "claimant": str(claim.claimant),
            "damage_title": claim.damage_title,
            "damage_description": claim.damage_description,
            "repair_estimate_url": claim.repair_estimate_url,
            "incident_proof_url": claim.incident_proof_url,
            "evidence_hash": claim.evidence_hash,
            "claimed_amount": int(claim.claimed_amount),
            "claimant_stake": int(claim.claimant_stake),
            "underwriter_deposit": int(claim.underwriter_deposit),
            "status": claim.status,
            "contest_reason": claim.contest_reason,
            "defense_rebuttal": claim.defense_rebuttal,
            "attempt_count": int(claim.attempt_count),
            "verdict_id": int(claim.verdict_id),
            "submitted_at": int(claim.submitted_at),
            "review_deadline": int(claim.review_deadline),
            "defense_deadline": int(claim.defense_deadline),
            "resolved_at": int(claim.resolved_at),
        }

    @gl.public.view
    def get_verdict(self, verdict_id: u32) -> dict:
        if verdict_id not in self.verdicts:
            raise gl.vm.UserError("Verdict not found")
        v = self.verdicts[verdict_id]
        return {
            "id": int(v.id),
            "claim_id": int(v.claim_id),
            "policy_id": int(v.policy_id),
            "canonical_verdict": v.canonical_verdict,
            "settlement_bps": int(v.settlement_bps),
            "covered_criteria_count": int(v.covered_criteria_count),
            "excluded_criteria_count": int(v.excluded_criteria_count),
            "partial_criteria_count": int(v.partial_criteria_count),
            "undetermined_criteria_count": int(v.undetermined_criteria_count),
            "ruling_summary": v.ruling_summary,
            "calculation_breakdown": v.calculation_breakdown,
            "evidence_verification_note": v.evidence_verification_note,
            "ruled_at": int(v.ruled_at),
        }

    @gl.public.view
    def get_total_policy_pools(self) -> int:
        return int(self.policy_pool_count)

    @gl.public.view
    def get_policy_count(self) -> int:
        return int(self.policy_pool_count)

    @gl.public.view
    def get_total_claims(self) -> int:
        return int(self.claim_count)

    @gl.public.view
    def get_claim_count(self) -> int:
        return int(self.claim_count)

    @gl.public.view
    def get_total_verdicts(self) -> int:
        return int(self.verdict_count)

    @gl.public.view
    def get_verdict_count(self) -> int:
        return int(self.verdict_count)

    @gl.public.view
    def get_all_policies(self, offset: int = 0, limit: int = 50) -> list[dict]:
        results: list[dict] = []
        total = int(self.policy_pool_count)
        start = max(1, offset + 1)
        end = min(total + 1, start + limit)

        for pid_int in range(start, end):
            pid = u256(pid_int)
            if pid in self.policy_pools:
                results.append(self.get_policy_pool(pid))
        return results

    @gl.public.view
    def get_policy_claims(self, policy_id: u256, offset: int = 0, limit: int = 50) -> list[dict]:
        results: list[dict] = []
        claim_total = int(self.claim_count)
        start = max(1, offset + 1)
        end = min(claim_total + 1, start + limit)

        for cid_int in range(start, end):
            cid = u256(cid_int)
            if cid in self.claims and self.claims[cid].policy_id == policy_id:
                results.append(self.get_claim(cid))
        return results

    @gl.public.view
    def get_claimant_claims(self, claimant_address: Address) -> list[dict]:
        results: list[dict] = []
        claim_total = int(self.claim_count)
        for cid_int in range(1, claim_total + 1):
            cid = u256(cid_int)
            if cid in self.claims and self.claims[cid].claimant == claimant_address:
                results.append(self.get_claim(cid))
        return results

    @gl.public.view
    def get_contract_version(self) -> str:
        return self.VERSION
