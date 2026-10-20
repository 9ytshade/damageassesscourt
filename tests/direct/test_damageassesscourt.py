"""Direct Mode test suite for DamageAssessCourt v1.0.0."""

from datetime import datetime, timedelta
import json
import pytest


CONTRACT = "contracts/damageassesscourt.py"
SAMPLE_POLICY_TITLE = "Commercial Property Windstorm & Water Intrusion Policy"
SAMPLE_POLICY_DESC = "Comprehensive commercial property coverage against windstorm damage and structural water intrusion."
SAMPLE_POLICY_TERMS = (
    "Perils Covered: Windstorm damage, torrential rainwater intrusion following structural opening, "
    "and associated debris removal. Exclusions: Pre-existing structural wear, unmitigated rot, rust, "
    "gradual deterioration, and normal cosmetic aging."
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
    title="Warehouse Roof Breach & Interior Water Damage",
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
# 1. DEPLOYMENT & METRICS
# ==============================================================================


def test_deploy_and_version(direct_deploy):
    contract = deploy_court(direct_deploy)
    assert contract.get_contract_version() == "1.0.0"
    assert contract.get_policy_count() == 0
    assert contract.get_claim_count() == 0
    assert contract.get_verdict_count() == 0


# ==============================================================================
# 2. POLICY POOL CREATION & CAPITAL MANAGEMENT
# ==============================================================================


def test_create_policy_happy_path(direct_vm, direct_deploy, direct_alice):
    contract = deploy_court(direct_deploy)
    policy_id = create_sample_policy(
        direct_vm,
        contract,
        underwriter=direct_alice,
        pool_funding=50_000,
        max_claim_cap=15_000,
        min_claimant_stake=800,
    )

    assert policy_id == 1
    assert contract.get_policy_count() == 1

    pool = contract.get_policy_pool(policy_id)
    assert pool["id"] == 1
    assert str(pool["underwriter"]).lower() == str(direct_alice).lower()
    assert pool["title"] == SAMPLE_POLICY_TITLE
    assert pool["total_escrow_pool"] == 50_000
    assert pool["max_claim_cap"] == 15_000
    assert pool["min_claimant_stake"] == 800
    assert pool["is_active"] is True
    assert pool["active_claims_count"] == 0
    assert pool["settled_claims_count"] == 0
    assert pool["total_payout_disbursed"] == 0


def test_create_policy_validations(direct_vm, direct_deploy, direct_alice):
    contract = deploy_court(direct_deploy)
    direct_vm.sender = direct_alice
    direct_vm.value = 10_000

    # Title too short (len < 3)
    with direct_vm.expect_revert("Title length is invalid"):
        contract.create_policy_pool(
            title="ab",
            description=SAMPLE_POLICY_DESC,
            policy_terms=SAMPLE_POLICY_TERMS,
            max_claim_cap=5_000,
            min_claimant_stake=500,
            review_window_seconds=86_400,
            defense_window_seconds=86_400,
        )

    # Description too short
    with direct_vm.expect_revert("Description length is invalid"):
        contract.create_policy_pool(
            title=SAMPLE_POLICY_TITLE,
            description="Short",
            policy_terms=SAMPLE_POLICY_TERMS,
            max_claim_cap=5_000,
            min_claimant_stake=500,
            review_window_seconds=86_400,
            defense_window_seconds=86_400,
        )

    # Policy terms too short
    with direct_vm.expect_revert("Policy terms length is invalid"):
        contract.create_policy_pool(
            title=SAMPLE_POLICY_TITLE,
            description=SAMPLE_POLICY_DESC,
            policy_terms="Short terms",
            max_claim_cap=5_000,
            min_claimant_stake=500,
            review_window_seconds=86_400,
            defense_window_seconds=86_400,
        )

    # Zero max claim limit
    with direct_vm.expect_revert("Max claim cap must be greater than zero and <= initial escrow deposit"):
        contract.create_policy_pool(
            title=SAMPLE_POLICY_TITLE,
            description=SAMPLE_POLICY_DESC,
            policy_terms=SAMPLE_POLICY_TERMS,
            max_claim_cap=0,
            min_claimant_stake=500,
            review_window_seconds=86_400,
            defense_window_seconds=86_400,
        )

    # Zero min claimant stake
    with direct_vm.expect_revert("Min claimant stake must be greater than zero"):
        contract.create_policy_pool(
            title=SAMPLE_POLICY_TITLE,
            description=SAMPLE_POLICY_DESC,
            policy_terms=SAMPLE_POLICY_TERMS,
            max_claim_cap=5_000,
            min_claimant_stake=0,
            review_window_seconds=86_400,
            defense_window_seconds=86_400,
        )


def test_fund_policy_pool(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = deploy_court(direct_deploy)
    policy_id = create_sample_policy(direct_vm, contract, underwriter=direct_alice, pool_funding=20_000)

    # Non-underwriter funding adds to pool
    direct_vm.sender = direct_bob
    direct_vm.value = 15_000
    contract.fund_policy_pool(policy_id)
    direct_vm.value = 0

    pool = contract.get_policy_pool(policy_id)
    assert pool["total_escrow_pool"] == 35_000


def test_archive_policy_pool_and_refund(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = deploy_court(direct_deploy)
    policy_id = create_sample_policy(direct_vm, contract, underwriter=direct_alice, pool_funding=30_000)

    # Non-underwriter cannot archive
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("Only underwriter can archive policy pool"):
        contract.archive_policy_pool(policy_id)

    # File active claim
    claim_id = file_sample_claim(direct_vm, contract, claimant=direct_bob, policy_id=policy_id, claimed_amount=5_000)

    # Archival blocked while active claims exist
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("Cannot archive policy pool with active unfinalized claims"):
        contract.archive_policy_pool(policy_id)

    # Underwriter resolves claim via direct approval
    contract.approve_claim(claim_id)

    # Now archival succeeds and refunds remaining capital
    contract.archive_policy_pool(policy_id)
    pool = contract.get_policy_pool(policy_id)
    assert pool["is_active"] is False
    assert pool["total_escrow_pool"] == 0


# ==============================================================================
# 3. CLAIM FILING & EXACT STAKE ACCOUNTING
# ==============================================================================


def test_file_claim_happy_path(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = deploy_court(direct_deploy)
    policy_id = create_sample_policy(direct_vm, contract, underwriter=direct_alice, pool_funding=50_000)

    claim_id = file_sample_claim(
        direct_vm,
        contract,
        claimant=direct_bob,
        policy_id=policy_id,
        claimed_amount=8_000,
        stake=1_000,
    )

    assert claim_id == 1
    assert contract.get_claim_count() == 1

    claim = contract.get_claim(claim_id)
    assert claim["id"] == 1
    assert claim["policy_id"] == policy_id
    assert str(claim["claimant"]).lower() == str(direct_bob).lower()
    assert claim["claimed_amount"] == 8_000
    assert claim["claimant_stake"] == 1_000
    assert claim["status"] == "submitted"

    pool = contract.get_policy_pool(policy_id)
    assert pool["active_claims_count"] == 1
    # 50,000 - 8,000 = 42,000 escrow pool remaining
    assert pool["total_escrow_pool"] == 42_000


def test_file_claim_excess_stake_refund(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = deploy_court(direct_deploy)
    policy_id = create_sample_policy(direct_vm, contract, underwriter=direct_alice, min_claimant_stake=1_000)

    # Claimant sends 2,500 wei (1,500 excess refunded, 1,000 locked)
    claim_id = file_sample_claim(
        direct_vm,
        contract,
        claimant=direct_bob,
        policy_id=policy_id,
        claimed_amount=5_000,
        stake=2_500,
    )

    claim = contract.get_claim(claim_id)
    assert claim["claimant_stake"] == 1_000


def test_file_claim_validations(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = deploy_court(direct_deploy)
    policy_id = create_sample_policy(
        direct_vm,
        contract,
        underwriter=direct_alice,
        pool_funding=50_000,
        max_claim_cap=10_000,
        min_claimant_stake=1_000,
    )

    # Underwriter cannot file claim on own policy
    direct_vm.sender = direct_alice
    direct_vm.value = 1_000
    with direct_vm.expect_revert("Underwriter cannot file claims against their own policy pool"):
        contract.file_claim(
            policy_id=policy_id,
            damage_title="Title",
            damage_description="Description",
            repair_estimate_url=SAMPLE_REPAIR_URL,
            incident_proof_url=SAMPLE_INCIDENT_URL,
            claimed_amount=5_000,
        )

    direct_vm.sender = direct_bob

    # Insufficient stake
    direct_vm.value = 500
    with direct_vm.expect_revert("Deposit is below minimum required claimant stake"):
        contract.file_claim(
            policy_id=policy_id,
            damage_title="Roof damage",
            damage_description="Windstorm breach on main building",
            repair_estimate_url=SAMPLE_REPAIR_URL,
            incident_proof_url=SAMPLE_INCIDENT_URL,
            claimed_amount=5_000,
        )

    # Claim exceeds max claim limit
    direct_vm.value = 1_000
    with direct_vm.expect_revert("Claimed amount must be greater than zero and <= policy max claim cap"):
        contract.file_claim(
            policy_id=policy_id,
            damage_title="Roof damage",
            damage_description="Windstorm breach on main building",
            repair_estimate_url=SAMPLE_REPAIR_URL,
            incident_proof_url=SAMPLE_INCIDENT_URL,
            claimed_amount=15_000,
        )

    # Duplicate evidence URL prevention
    direct_vm.value = 1_000
    contract.file_claim(
        policy_id=policy_id,
        damage_title="Roof damage 1",
        damage_description="Windstorm breach on main building",
        repair_estimate_url=SAMPLE_REPAIR_URL,
        incident_proof_url=SAMPLE_INCIDENT_URL,
        claimed_amount=4_000,
    )

    direct_vm.value = 1_000
    with direct_vm.expect_revert("Repair estimate evidence is currently active in another claim"):
        contract.file_claim(
            policy_id=policy_id,
            damage_title="Roof damage 2",
            damage_description="Windstorm breach on another building",
            repair_estimate_url=SAMPLE_REPAIR_URL,
            incident_proof_url=SAMPLE_INCIDENT_URL,
            claimed_amount=4_000,
        )


# ==============================================================================
# 4. DIRECT UNDERWRITER APPROVAL
# ==============================================================================


def test_approve_claim_direct(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = deploy_court(direct_deploy)
    policy_id = create_sample_policy(direct_vm, contract, underwriter=direct_alice, pool_funding=50_000)
    claim_id = file_sample_claim(
        direct_vm, contract, claimant=direct_bob, policy_id=policy_id, claimed_amount=10_000, stake=1_000
    )

    # Non-underwriter cannot approve
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("Only policy underwriter can approve claims"):
        contract.approve_claim(claim_id)

    # Underwriter approves claim directly
    direct_vm.sender = direct_alice
    contract.approve_claim(claim_id)

    claim = contract.get_claim(claim_id)
    assert claim["status"] == "approved"

    pool = contract.get_policy_pool(policy_id)
    assert pool["active_claims_count"] == 0
    assert pool["settled_claims_count"] == 1
    assert pool["total_payout_disbursed"] == 10_000


# ==============================================================================
# 5. UNCONTESTED CLAIM TIMEOUT SETTLEMENT
# ==============================================================================


def test_settle_uncontested_claim_timeout(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = deploy_court(direct_deploy)
    policy_id = create_sample_policy(
        direct_vm, contract, underwriter=direct_alice, pool_funding=50_000, review_window=86_400
    )
    claim_id = file_sample_claim(
        direct_vm, contract, claimant=direct_bob, policy_id=policy_id, claimed_amount=6_000, stake=1_000
    )

    # Premature settlement attempt reverts
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("Underwriter review window has not yet expired"):
        contract.settle_uncontested_claim(claim_id)

    # Warp past review deadline
    advance_time(direct_vm, seconds=86_400 + 10)

    # Now uncontested settlement succeeds
    contract.settle_uncontested_claim(claim_id)

    claim = contract.get_claim(claim_id)
    assert claim["status"] == "approved"

    pool = contract.get_policy_pool(policy_id)
    assert pool["active_claims_count"] == 0
    assert pool["settled_claims_count"] == 1
    assert pool["total_payout_disbursed"] == 6_000


# ==============================================================================
# 6. CONTESTATION & DEFENSE REBUTTAL LIFECYCLE
# ==============================================================================


def test_contest_and_defense_lifecycle(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = deploy_court(direct_deploy)
    policy_id = create_sample_policy(direct_vm, contract, underwriter=direct_alice, pool_funding=50_000)
    claim_id = file_sample_claim(
        direct_vm, contract, claimant=direct_bob, policy_id=policy_id, claimed_amount=8_000, stake=1_000
    )

    # Non-underwriter cannot contest
    direct_vm.sender = direct_bob
    direct_vm.value = 1_000
    with direct_vm.expect_revert("Only policy underwriter can contest claims"):
        contract.contest_claim(claim_id, "Disputing cause of damage")

    # Underwriter contests with insufficient deposit
    direct_vm.sender = direct_alice
    direct_vm.value = 500
    with direct_vm.expect_revert("Underwriter dispute deposit must match claimant stake amount"):
        contract.contest_claim(claim_id, "Disputing cause of damage")

    # Underwriter contests with matching stake (1,000 wei)
    direct_vm.sender = direct_alice
    direct_vm.value = 1_000
    contract.contest_claim(claim_id, "Contractor quote includes pre-existing rusted structural beams.")
    direct_vm.value = 0

    claim = contract.get_claim(claim_id)
    assert claim["status"] == "contested"
    assert claim["underwriter_deposit"] == 1_000
    assert claim["contest_reason"] == "Contractor quote includes pre-existing rusted structural beams."

    # Claimant submits defense rebuttal without waiving time
    direct_vm.sender = direct_bob
    contract.submit_claimant_defense(
        claim_id=claim_id,
        defense_rebuttal="Rusted fasteners are ancillary; the storm winds tore off new membrane panels installed 2025.",
        waive_remaining_time=False,
    )

    claim = contract.get_claim(claim_id)
    assert claim["status"] == "defended"
    assert "storm winds tore off new membrane" in claim["defense_rebuttal"]

    # Adjudication prematurely attempted while defense window is open
    with direct_vm.expect_revert("Claimant defense window is currently active"):
        contract.adjudicate_claim(claim_id)

    # Claimant waives remaining window
    contract.submit_claimant_defense(
        claim_id=claim_id,
        defense_rebuttal="Rusted fasteners are ancillary; the storm winds tore off new membrane panels installed 2025.",
        waive_remaining_time=True,
    )


# ==============================================================================
# 7. AI MAGISTRATE EQUIVALENCE ADJUDICATION SCENARIOS
# ==============================================================================


def test_adjudicate_full_indemnity_10000_bps(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = deploy_court(direct_deploy)
    policy_id = create_sample_policy(direct_vm, contract, underwriter=direct_alice, pool_funding=50_000)
    claim_id = file_sample_claim(
        direct_vm, contract, claimant=direct_bob, policy_id=policy_id, claimed_amount=10_000, stake=1_000
    )

    # Underwriter contests
    direct_vm.sender = direct_alice
    direct_vm.value = 1_000
    contract.contest_claim(claim_id, "Disputing whether wind gusts exceeded storm threshold.")
    direct_vm.value = 0

    # Claimant defends and waives window
    direct_vm.sender = direct_bob
    contract.submit_claimant_defense(
        claim_id=claim_id,
        defense_rebuttal="NOAA weather log documents sustained 81.4 mph gusts.",
        waive_remaining_time=True,
    )

    # Mock NOAA weather log
    direct_vm.mock_web(
        r".*storm-logs.*",
        {
            "status": 200,
            "body": json.dumps({
                "station": "KGLF-09",
                "max_wind_gust_mph": 81.4,
                "pressure_mb": 978.2,
                "event_type": "Hurricane/Severe Windstorm",
            }),
        },
    )

    # Mock Contractor repair estimate
    direct_vm.mock_web(
        r".*estimates.*",
        {
            "status": 200,
            "body": json.dumps({
                "estimate_id": "EST-88219",
                "total_cost": 10000,
                "items": [
                    {"code": "RF-01", "desc": "Roof membrane replacement", "cost": 7500, "peril": "windstorm"},
                    {"code": "WT-02", "desc": "Water extraction and dryout", "cost": 2500, "peril": "water_intrusion"},
                ],
            }),
        },
    )

    # Mock AI Court consensus ruling: 10,000 BPS (100% full indemnity)
    direct_vm.mock_llm(
        r".*Insurance Damage Court Magistrate.*",
        json.dumps({
            "canonical_verdict": "FULL_INDEMNITY",
            "settlement_bps": 10000,
            "covered_criteria_count": 2,
            "excluded_criteria_count": 0,
            "partial_criteria_count": 0,
            "undetermined_criteria_count": 0,
            "ruling_summary": "All claimed damages directly caused by confirmed 81.4 mph windstorm. No excluded line items.",
            "calculation_breakdown": "10000 BPS - 100% of line items covered under windstorm peril.",
            "evidence_verification_note": "NOAA log verified 81.4 mph; contractor estimate verified.",
        }),
    )

    contract.adjudicate_claim(claim_id)

    claim = contract.get_claim(claim_id)
    assert claim["status"] == "resolved"
    assert claim["verdict_id"] == 1

    verdict = contract.get_verdict(1)
    assert verdict["canonical_verdict"] == "FULL_INDEMNITY"
    assert verdict["settlement_bps"] == 10000

    pool = contract.get_policy_pool(policy_id)
    assert pool["settled_claims_count"] == 1
    assert pool["total_payout_disbursed"] == 10_000


def test_adjudicate_proportional_partial_settlement_6850_bps(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = deploy_court(direct_deploy)
    policy_id = create_sample_policy(direct_vm, contract, underwriter=direct_alice, pool_funding=50_000)
    claim_id = file_sample_claim(
        direct_vm, contract, claimant=direct_bob, policy_id=policy_id, claimed_amount=10_000, stake=1_000
    )

    # Underwriter contests pre-existing wear
    direct_vm.sender = direct_alice
    direct_vm.value = 1_000
    contract.contest_claim(claim_id, "Quote includes pre-existing wear on flashing and structural rust.")
    direct_vm.value = 0

    # Claimant defends and waives window
    direct_vm.sender = direct_bob
    contract.submit_claimant_defense(
        claim_id=claim_id,
        defense_rebuttal="Agreed some fasteners had rust, but storm tore off main panels.",
        waive_remaining_time=True,
    )

    # Mock web responses
    direct_vm.mock_web(r".*storm-logs.*", {"status": 200, "body": '{"max_wind_gust_mph": 75.0}'})
    direct_vm.mock_web(r".*estimates.*", {"status": 200, "body": '{"total_cost": 10000, "covered": 6850, "wear": 3150}'})

    # Mock AI Court consensus ruling: 6,850 BPS (68.5% partial settlement)
    direct_vm.mock_llm(
        r".*Insurance Damage Court Magistrate.*",
        json.dumps({
            "canonical_verdict": "PARTIAL_SETTLEMENT",
            "settlement_bps": 6850,
            "covered_criteria_count": 2,
            "excluded_criteria_count": 1,
            "partial_criteria_count": 0,
            "undetermined_criteria_count": 0,
            "ruling_summary": "68.5% approved for storm membrane tear. 31.5% deducted for pre-existing rust exclusion.",
            "calculation_breakdown": "6850 BPS: $6,850 indemnity approved; $3,150 retained by insurer pool.",
            "evidence_verification_note": "NOAA wind verified; contractor estimate itemized.",
        }),
    )

    contract.adjudicate_claim(claim_id)

    claim = contract.get_claim(claim_id)
    assert claim["status"] == "resolved"

    verdict = contract.get_verdict(1)
    assert verdict["canonical_verdict"] == "PARTIAL_SETTLEMENT"
    assert verdict["settlement_bps"] == 6850

    pool = contract.get_policy_pool(policy_id)
    assert pool["settled_claims_count"] == 1
    # 6,850 disbursed
    assert pool["total_payout_disbursed"] == 6_850
    # Retained $3,150 returned to pool: 40,000 + 3,150 = 43,150
    assert pool["total_escrow_pool"] == 43_150


def test_adjudicate_legitimate_exclusion_denial_0_bps(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = deploy_court(direct_deploy)
    policy_id = create_sample_policy(direct_vm, contract, underwriter=direct_alice, pool_funding=50_000)
    claim_id = file_sample_claim(
        direct_vm, contract, claimant=direct_bob, policy_id=policy_id, claimed_amount=10_000, stake=1_000
    )

    # Underwriter contests
    direct_vm.sender = direct_alice
    direct_vm.value = 1_000
    contract.contest_claim(claim_id, "Damage is entirely pre-existing rust rot, not windstorm.")
    direct_vm.value = 0

    # Claimant defends and waives window
    direct_vm.sender = direct_bob
    contract.submit_claimant_defense(
        claim_id=claim_id,
        defense_rebuttal="Water entered building during rainfall.",
        waive_remaining_time=True,
    )

    # Mock web responses
    direct_vm.mock_web(r".*storm-logs.*", {"status": 200, "body": '{"max_wind_gust_mph": 22.0}'})
    direct_vm.mock_web(r".*estimates.*", {"status": 200, "body": '{"total_cost": 10000, "cause": "gradual rot"}'})

    # Mock AI Court consensus ruling: 0 BPS (legitimate exclusion, NO fraud)
    direct_vm.mock_llm(
        r".*Insurance Damage Court Magistrate.*",
        json.dumps({
            "canonical_verdict": "CLAIM_DENIED",
            "settlement_bps": 0,
            "covered_criteria_count": 0,
            "excluded_criteria_count": 2,
            "partial_criteria_count": 0,
            "undetermined_criteria_count": 0,
            "ruling_summary": "Wind gusts only 22 mph (below threshold). Water leakage caused by gradual rust rot.",
            "calculation_breakdown": "0 BPS - Total exclusion under wear and tear policy clause.",
            "evidence_verification_note": "Legitimate claim submission but excluded under policy terms.",
        }),
    )

    contract.adjudicate_claim(claim_id)

    claim = contract.get_claim(claim_id)
    assert claim["status"] == "resolved"

    verdict = contract.get_verdict(1)
    assert verdict["canonical_verdict"] == "CLAIM_DENIED"
    assert verdict["settlement_bps"] == 0

    pool = contract.get_policy_pool(policy_id)
    # Full $10,000 claimed amount retained in escrow pool: 40,000 + 10,000 = 50,000
    assert pool["total_escrow_pool"] == 50_000
    assert pool["settled_claims_count"] == 0


def test_adjudicate_fraudulent_claim_slashed(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = deploy_court(direct_deploy)
    policy_id = create_sample_policy(direct_vm, contract, underwriter=direct_alice, pool_funding=50_000)
    claim_id = file_sample_claim(
        direct_vm, contract, claimant=direct_bob, policy_id=policy_id, claimed_amount=10_000, stake=1_000
    )

    # Underwriter contests
    direct_vm.sender = direct_alice
    direct_vm.value = 1_000
    contract.contest_claim(claim_id, "Fabricated estimate from dissolved company.")
    direct_vm.value = 0

    # Claimant defends and waives window
    direct_vm.sender = direct_bob
    contract.submit_claimant_defense(
        claim_id=claim_id,
        defense_rebuttal="Contractor estimate is genuine.",
        waive_remaining_time=True,
    )

    # Mock web responses
    direct_vm.mock_web(r".*storm-logs.*", {"status": 200, "body": '{"weather": "Sunny, zero wind"}'})
    direct_vm.mock_web(r".*estimates.*", {"status": 200, "body": '{"forged_stamp": true}'})

    # Mock AI Court consensus ruling: FRAUD_SLASHED
    direct_vm.mock_llm(
        r".*Insurance Damage Court Magistrate.*",
        json.dumps({
            "canonical_verdict": "FRAUD_SLASHED",
            "settlement_bps": 0,
            "covered_criteria_count": 0,
            "excluded_criteria_count": 1,
            "partial_criteria_count": 0,
            "undetermined_criteria_count": 0,
            "ruling_summary": "Fabricated repair estimate and no storm occurred. Flagrant fraudulent claim.",
            "calculation_breakdown": "0 BPS - Fraud slashing applied. Stake forfeited.",
            "evidence_verification_note": "Forged evidence detected.",
        }),
    )

    contract.adjudicate_claim(claim_id)

    claim = contract.get_claim(claim_id)
    assert claim["status"] == "rejected_slashed"

    verdict = contract.get_verdict(1)
    assert verdict["canonical_verdict"] == "FRAUD_SLASHED"

    pool = contract.get_policy_pool(policy_id)
    # Claimed amount (10,000) + slashed stake (1,000) returned to pool: 40,000 + 11,000 = 51,000
    assert pool["total_escrow_pool"] == 51_000


# ==============================================================================
# 8. PAGINATION & VIEW FUNCTIONS
# ==============================================================================


def test_pagination_and_views(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = deploy_court(direct_deploy)
    p1 = create_sample_policy(direct_vm, contract, underwriter=direct_alice, title="Policy 1", pool_funding=20_000)
    p2 = create_sample_policy(direct_vm, contract, underwriter=direct_alice, title="Policy 2", pool_funding=20_000)

    all_policies = contract.get_all_policies(offset=0, limit=10)
    assert len(all_policies) == 2
    assert all_policies[0]["title"] == "Policy 1"
    assert all_policies[1]["title"] == "Policy 2"

    c1 = file_sample_claim(
        direct_vm,
        contract,
        claimant=direct_bob,
        policy_id=p1,
        title="Claim 1",
        incident_url="https://noaa.example.gov/1.json",
        repair_url="https://repair.example.com/1.json",
    )
    c2 = file_sample_claim(
        direct_vm,
        contract,
        claimant=direct_bob,
        policy_id=p1,
        title="Claim 2",
        incident_url="https://noaa.example.gov/2.json",
        repair_url="https://repair.example.com/2.json",
    )

    claims = contract.get_policy_claims(policy_id=p1, offset=0, limit=10)
    assert len(claims) == 2
    assert claims[0]["damage_title"] == "Claim 1"
    assert claims[1]["damage_title"] == "Claim 2"
