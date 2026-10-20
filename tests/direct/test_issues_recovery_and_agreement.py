"""Adversarial stress and economic recovery test suite for DamageAssessCourt v1.0.0.

Coverage includes:
1. Fast-path deterministic slashing on dead or fabricated evidence links (HTTP 404 / 410).
2. Upstream transient server outage safeguard (HTTP 429 / 5xx) with attempt count tracking.
3. Terminal liveness recovery on retry exhaustion (5 attempts) and timeout (86,400s).
4. Premature exhaustion recovery prevention.
5. Replay protection and duplicate evidence reuse prevention after settlement.
6. Value conservation invariant across multi-claim lifecycles.
"""

from datetime import datetime, timedelta
import json
import pytest


CONTRACT = "contracts/damageassesscourt.py"
SAMPLE_POLICY_TITLE = "Commercial Industrial Windstorm & Water Risk Pool"
SAMPLE_POLICY_DESC = "Underwritten risk pool protecting commercial facilities against storm surges and wind damage."
SAMPLE_POLICY_TERMS = (
    "Perils Covered: Windstorm damage exceeding 50mph, torrential water intrusion. "
    "Exclusions: Pre-existing structural wear, unmitigated rot, rust, gradual deterioration."
)
SAMPLE_INCIDENT_URL = "https://noaa.weather.example.gov/storm-logs/gulf-oct-2026.json"
SAMPLE_REPAIR_URL = "https://contractor.repair.example.com/estimates/quote-88219.json"


def advance_time(direct_vm, seconds: int = 86_400 + 10):
    curr = datetime.fromisoformat(direct_vm._datetime.replace("Z", "+00:00"))
    future = curr + timedelta(seconds=seconds)
    direct_vm.warp(future.isoformat().replace("+00:00", "Z"))


def deploy_court(direct_deploy):
    return direct_deploy(CONTRACT)


def create_sample_policy(
    direct_vm,
    contract,
    underwriter,
    title=SAMPLE_POLICY_TITLE,
    description=SAMPLE_POLICY_DESC,
    terms=SAMPLE_POLICY_TERMS,
    pool_funding=100_000,
    max_claim_cap=None,
    min_claimant_stake=1_000,
    review_window=86_400,
    defense_window=86_400,
):
    if max_claim_cap is None:
        max_claim_cap = min(pool_funding // 2, 25_000)
    direct_vm.sender = underwriter
    direct_vm.value = pool_funding
    policy_id = contract.create_policy_pool(
        title=title,
        description=description,
        policy_terms=terms,
        max_claim_cap=max_claim_cap,
        min_claimant_stake=min_claimant_stake,
        review_window_seconds=review_window,
        defense_window_seconds=defense_window,
    )
    direct_vm.value = 0
    return policy_id


def file_sample_claim(
    direct_vm,
    contract,
    claimant,
    policy_id=1,
    title="Structural Roof Collapse & Flooding",
    narrative="Severe 80mph gusts sheared membrane on Bay 3, causing heavy interior water intrusion.",
    claimed_amount=10_000,
    stake=1_000,
    incident_url=SAMPLE_INCIDENT_URL,
    repair_url=SAMPLE_REPAIR_URL,
):
    direct_vm.sender = claimant
    direct_vm.value = stake
    claim_id = contract.file_claim(
        policy_id=policy_id,
        damage_title=title,
        damage_description=narrative,
        repair_estimate_url=repair_url,
        incident_proof_url=incident_url,
        claimed_amount=claimed_amount,
    )
    direct_vm.value = 0
    return claim_id


# ==============================================================================
# 1. FAST-PATH DEAD LINK SLASHING (HTTP 404 / 410)
# ==============================================================================


def test_dead_link_404_fast_path_slashing(direct_vm, direct_deploy, direct_alice, direct_bob):
    """Evidence links returning HTTP 404 or 410 trigger deterministic fast-path slashing.

    The claimant's anti-spam stake is forfeited into the policy pool, the claimed amount
    liability is restored, and the underwriter's dispute deposit is fully refunded.
    """
    contract = deploy_court(direct_deploy)
    policy_id = create_sample_policy(direct_vm, contract, underwriter=direct_alice, pool_funding=50_000)
    claim_id = file_sample_claim(
        direct_vm, contract, claimant=direct_bob, policy_id=policy_id, claimed_amount=8_000, stake=1_000
    )

    # Underwriter contests
    direct_vm.sender = direct_alice
    direct_vm.value = 1_000
    contract.contest_claim(claim_id, "Evidence links appear to be non-existent fabricated URLs.")
    direct_vm.value = 0

    # Claimant defends and waives window
    direct_vm.sender = direct_bob
    contract.submit_claimant_defense(
        claim_id=claim_id,
        defense_rebuttal="Contractor host is online.",
        waive_remaining_time=True,
    )

    # Mock weather link returning 200, but repair estimate returning 404 Dead Link
    direct_vm.mock_web(r".*storm-logs.*", {"status": 200, "body": '{"wind_mph": 60}'})
    direct_vm.mock_web(r".*estimates.*", {"status": 404, "body": "404 Not Found"})

    contract.adjudicate_claim(claim_id)

    claim = contract.get_claim(claim_id)
    assert claim["status"] == "rejected_slashed"
    assert claim["verdict_id"] == 1

    verdict = contract.get_verdict(1)
    assert verdict["canonical_verdict"] == "FRAUD_SLASHED"
    assert verdict["settlement_bps"] == 0
    assert "404" in verdict["ruling_summary"]

    pool = contract.get_policy_pool(policy_id)
    # 50,000 - 8,000 (initially reserved) + 8,000 (liability restored) + 1,000 (slashed stake) = 51,000
    assert pool["total_escrow_pool"] == 51_000
    assert pool["active_claims_count"] == 0


# ==============================================================================
# 2. TRANSIENT SERVER 5xx OUTAGE SAFEGUARD
# ==============================================================================


def test_transient_server_5xx_outage_safeguard(direct_vm, direct_deploy, direct_alice, direct_bob):
    """When external evidence sources return HTTP 500/502/503/504 or 429, the contract

    must not wrongfully slash the claimant. It increments attempt_count and preserves
    escrow balances for future validator retry.
    """
    contract = deploy_court(direct_deploy)
    policy_id = create_sample_policy(direct_vm, contract, underwriter=direct_alice, pool_funding=50_000)
    claim_id = file_sample_claim(
        direct_vm, contract, claimant=direct_bob, policy_id=policy_id, claimed_amount=6_000, stake=1_000
    )

    # Underwriter contests
    direct_vm.sender = direct_alice
    direct_vm.value = 1_000
    contract.contest_claim(claim_id, "Disputing cause of structural damage.")
    direct_vm.value = 0

    # Claimant defends and waives window
    direct_vm.sender = direct_bob
    contract.submit_claimant_defense(
        claim_id=claim_id,
        defense_rebuttal="Weather evidence documents 75mph gusts.",
        waive_remaining_time=True,
    )

    # Mock weather link returning 503 Gateway Unavailable
    direct_vm.mock_web(r".*storm-logs.*", {"status": 503, "body": "503 Service Unavailable"})
    direct_vm.mock_web(r".*estimates.*", {"status": 200, "body": '{"total_cost": 6000}'})

    # Adjudication attempt 1
    contract.adjudicate_claim(claim_id)

    claim = contract.get_claim(claim_id)
    # Claim remains defended and unresolved
    assert claim["status"] == "defended"
    assert claim["attempt_count"] == 1
    assert claim["verdict_id"] == 0

    # Policy pool funds remain safely locked in escrow
    pool = contract.get_policy_pool(policy_id)
    assert pool["total_escrow_pool"] == 44_000
    assert pool["active_claims_count"] == 1

    # Adjudication attempt 2
    contract.adjudicate_claim(claim_id)
    claim = contract.get_claim(claim_id)
    assert claim["attempt_count"] == 2


# ==============================================================================
# 3. TERMINAL LIVENESS & OUTAGE RECOVERY
# ==============================================================================


def test_terminal_exhaustion_recovery_by_attempts(direct_vm, direct_deploy, direct_alice, direct_bob):
    """When a claim encounters 5 consecutive transient failures (attempt_count >= 5),

    either party can trigger resolve_exhausted_claim. The claim transitions to 'exhausted',
    uncommitted claim liability is restored to the pool, and both the claimant stake and
    underwriter dispute deposit are 100% refunded.
    """
    contract = deploy_court(direct_deploy)
    policy_id = create_sample_policy(direct_vm, contract, underwriter=direct_alice, pool_funding=50_000)
    claim_id = file_sample_claim(
        direct_vm, contract, claimant=direct_bob, policy_id=policy_id, claimed_amount=7_000, stake=1_000
    )

    direct_vm.sender = direct_alice
    direct_vm.value = 1_000
    contract.contest_claim(claim_id, "Disputing cause: contractor quote includes pre-existing rot.")
    direct_vm.value = 0

    direct_vm.sender = direct_bob
    contract.submit_claimant_defense(
        claim_id=claim_id,
        defense_rebuttal="Claimant rebuttal: storm winds tore off roof membrane.",
        waive_remaining_time=True,
    )

    # Mock 500 error
    direct_vm.mock_web(r".*storm-logs.*", {"status": 500, "body": "500 Internal Error"})
    direct_vm.mock_web(r".*estimates.*", {"status": 200, "body": '{"total_cost": 7000}'})

    # Run 5 failed attempts
    for _ in range(5):
        contract.adjudicate_claim(claim_id)

    claim = contract.get_claim(claim_id)
    assert claim["attempt_count"] == 5
    assert claim["status"] == "defended"

    # Now resolve_exhausted_claim succeeds
    contract.resolve_exhausted_claim(claim_id)

    claim = contract.get_claim(claim_id)
    assert claim["status"] == "exhausted"

    pool = contract.get_policy_pool(policy_id)
    # Claimed amount 7,000 restored to escrow pool: 43,000 + 7,000 = 50,000
    assert pool["total_escrow_pool"] == 50_000
    assert pool["active_claims_count"] == 0


def test_terminal_exhaustion_recovery_by_timeout(direct_vm, direct_deploy, direct_alice, direct_bob):
    """Even with fewer than 5 attempts, if 86,400s (24 hours) have elapsed since submission

    during an unresolved dispute, resolve_exhausted_claim unlocks capital.
    """
    contract = deploy_court(direct_deploy)
    policy_id = create_sample_policy(direct_vm, contract, underwriter=direct_alice, pool_funding=40_000)
    claim_id = file_sample_claim(
        direct_vm, contract, claimant=direct_bob, policy_id=policy_id, claimed_amount=5_000, stake=1_000
    )

    direct_vm.sender = direct_alice
    direct_vm.value = 1_000
    contract.contest_claim(claim_id, "Disputing cause: contractor quote includes pre-existing rot.")
    direct_vm.value = 0

    # Only 1 attempt made
    direct_vm.mock_web(r".*storm-logs.*", {"status": 504, "body": "Gateway Timeout"})
    direct_vm.mock_web(r".*estimates.*", {"status": 200, "body": '{"total_cost": 5000}'})

    direct_vm.sender = direct_bob
    contract.submit_claimant_defense(
        claim_id=claim_id,
        defense_rebuttal="Claimant rebuttal: storm winds tore off roof membrane.",
        waive_remaining_time=True,
    )
    contract.adjudicate_claim(claim_id)

    # Premature exhaustion recovery attempt reverts
    with direct_vm.expect_revert("Claim has not met exhaustion criteria"):
        contract.resolve_exhausted_claim(claim_id)

    # Advance time by 86,400s + 10s
    advance_time(direct_vm, seconds=86_400 + 10)

    # Now succeeds
    contract.resolve_exhausted_claim(claim_id)
    claim = contract.get_claim(claim_id)
    assert claim["status"] == "exhausted"

    pool = contract.get_policy_pool(policy_id)
    assert pool["total_escrow_pool"] == 40_000
    assert pool["active_claims_count"] == 0


# ==============================================================================
# 4. DUPLICATE EVIDENCE REUSE PREVENTION
# ==============================================================================


def test_duplicate_evidence_reuse_prevention_after_settlement(direct_vm, direct_deploy, direct_alice, direct_bob):
    """Once a repair estimate URL has been rewarded/settled, submitting the same URL

    in a subsequent claim on the same policy pool must revert to prevent double dipping.
    """
    contract = deploy_court(direct_deploy)
    policy_id = create_sample_policy(direct_vm, contract, underwriter=direct_alice, pool_funding=50_000)

    # File and approve claim 1
    c1 = file_sample_claim(
        direct_vm, contract, claimant=direct_bob, policy_id=policy_id, claimed_amount=10_000, stake=1_000
    )
    direct_vm.sender = direct_alice
    contract.approve_claim(c1)

    claim1 = contract.get_claim(c1)
    assert claim1["status"] == "approved"

    # Attacker tries to file a second claim reusing the same repair estimate URL
    direct_vm.sender = direct_bob
    direct_vm.value = 1_000
    with direct_vm.expect_revert("Repair estimate evidence has already been settled and rewarded"):
        contract.file_claim(
            policy_id=policy_id,
            damage_title="Roof Damage Again",
            damage_description="Another windstorm allegedly damaged the exact same roof.",
            repair_estimate_url=SAMPLE_REPAIR_URL,
            incident_proof_url="https://noaa.example.gov/storm2.json",
            claimed_amount=10_000,
        )


# ==============================================================================
# 5. MULTI-CLAIM VALUE CONSERVATION INVARIANT
# ==============================================================================


def test_value_conservation_invariant_across_multiple_claims(direct_vm, direct_deploy, direct_alice, direct_bob):
    """Verifies that across multiple simultaneous claims with different outcomes

    (approved, contested and settled partial, and contested and rejected slashed),
    the policy pool escrow balance exactly reflects the mathematical sum of remaining
    liabilities, with zero fund leaks.
    """
    contract = deploy_court(direct_deploy)
    # Underwriter creates pool with 100,000 wei
    policy_id = create_sample_policy(
        direct_vm,
        contract,
        underwriter=direct_alice,
        pool_funding=100_000,
        max_claim_cap=25_000,
        min_claimant_stake=1_000,
    )

    # Claim 1: 10,000 wei -> Directly approved (10,000 disbursed from pool)
    c1 = file_sample_claim(
        direct_vm,
        contract,
        claimant=direct_bob,
        policy_id=policy_id,
        claimed_amount=10_000,
        stake=1_000,
        repair_url="https://repair.example.com/c1.json",
    )
    direct_vm.sender = direct_alice
    contract.approve_claim(c1)

    pool = contract.get_policy_pool(policy_id)
    # 100,000 - 10,000 = 90,000
    assert pool["total_escrow_pool"] == 90_000
    assert pool["total_payout_disbursed"] == 10_000

    # Claim 2: 10,000 wei -> Contested and settled at 5,000 BPS (50% = 5,000 disbursed, 5,000 retained)
    c2 = file_sample_claim(
        direct_vm,
        contract,
        claimant=direct_bob,
        policy_id=policy_id,
        claimed_amount=10_000,
        stake=1_000,
        repair_url="https://repair.example.com/c2.json",
    )
    direct_vm.sender = direct_alice
    direct_vm.value = 1_000
    contract.contest_claim(c2, "Excluding cosmetic siding.")
    direct_vm.value = 0

    direct_vm.sender = direct_bob
    contract.submit_claimant_defense(c2, "Cosmetic siding was damaged by hail.", waive_remaining_time=True)

    direct_vm.mock_web(r".*storm-logs.*", {"status": 200, "body": '{"wind_mph": 60}'})
    direct_vm.mock_web(r".*c2\.json.*", {"status": 200, "body": '{"covered": 5000, "cosmetic": 5000}'})

    direct_vm.mock_llm(
        r".*c2\.json.*",
        json.dumps({
            "canonical_verdict": "PARTIAL_SETTLEMENT",
            "settlement_bps": 5000,
            "covered_criteria_count": 1,
            "excluded_criteria_count": 1,
            "partial_criteria_count": 0,
            "undetermined_criteria_count": 0,
            "ruling_summary": "50% partial indemnity approved; 50% excluded cosmetic damage.",
            "calculation_breakdown": "5000 BPS: 5,000 paid; 5,000 retained in pool.",
            "evidence_verification_note": "Verified itemized repair split.",
        }),
    )

    contract.adjudicate_claim(c2)

    pool = contract.get_policy_pool(policy_id)
    # 90,000 - 10,000 (reserved) + 5,000 (retained) = 85,000
    assert pool["total_escrow_pool"] == 85_000
    # 10,000 (from c1) + 5,000 (from c2) = 15,000 disbursed
    assert pool["total_payout_disbursed"] == 15_000
    assert pool["settled_claims_count"] == 2

    # Claim 3: 10,000 wei -> Contested and FRAUD_SLASHED (1,000 stake slashed into pool)
    c3 = file_sample_claim(
        direct_vm,
        contract,
        claimant=direct_bob,
        policy_id=policy_id,
        claimed_amount=10_000,
        stake=1_000,
        repair_url="https://repair.example.com/c3.json",
    )
    direct_vm.sender = direct_alice
    direct_vm.value = 1_000
    contract.contest_claim(c3, "Fabricated claim: company was dissolved before the storm.")
    direct_vm.value = 0

    direct_vm.sender = direct_bob
    contract.submit_claimant_defense(
        c3,
        "Claimant rebuttal: repair estimate was produced by legitimate contractor.",
        waive_remaining_time=True,
    )

    direct_vm.mock_web(r".*storm-logs.*", {"status": 200, "body": '{"wind_mph": 0}'})
    direct_vm.mock_web(r".*c3\.json.*", {"status": 200, "body": '{"forged": true}'})

    direct_vm.mock_llm(
        r".*c3\.json.*",
        json.dumps({
            "canonical_verdict": "FRAUD_SLASHED",
            "settlement_bps": 0,
            "covered_criteria_count": 0,
            "excluded_criteria_count": 1,
            "partial_criteria_count": 0,
            "undetermined_criteria_count": 0,
            "ruling_summary": "Fraudulent claim.",
            "calculation_breakdown": "0 BPS - Fraud slashing applied.",
            "evidence_verification_note": "Forged evidence detected.",
        }),
    )

    contract.adjudicate_claim(c3)

    pool = contract.get_policy_pool(policy_id)
    # 85,000 - 10,000 (reserved) + 10,000 (liability restored) + 1,000 (slashed stake) = 86,000
    assert pool["total_escrow_pool"] == 86_000
    assert pool["active_claims_count"] == 0
    # Disbursed remains 15,000
    assert pool["total_payout_disbursed"] == 15_000
