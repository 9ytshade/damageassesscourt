# DamageAssessCourt: Intelligent Contract Specification

## 1. Storage Layout & Data Structures

```python
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
    status: str                       # 'active' | 'archived'
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
    status: str                       # 'submitted' | 'approved' | 'contested' | 'defended' | 'resolved' | 'rejected_slashed' | 'exhausted'
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
    canonical_verdict: str            # 'FULL_INDEMNITY' | 'PARTIAL_SETTLEMENT' | 'CLAIM_DENIED' | 'FRAUD_SLASHED' | 'UNDETERMINED'
    settlement_bps: u16               # 0 - 10,000 (0.00% to 100.00%)
    covered_criteria_count: u8
    excluded_criteria_count: u8
    partial_criteria_count: u8
    undetermined_criteria_count: u8
    ruling_summary: str
    calculation_breakdown: str
    evidence_verification_note: str
    ruled_at: u64
```

### Persistent Contract State
```python
class DamageAssessCourt(gl.Contract):
    VERSION = "1.0.0"

    policy_pool_count: u256
    claim_count: u256
    verdict_count: u32

    policy_pools: TreeMap[u256, PolicyPool]
    claims: TreeMap[u256, Claim]
    verdicts: TreeMap[u32, Verdict]
    rewarded_evidence: TreeMap[str, bool]
    active_evidence: TreeMap[str, bool]
```

---

## 2. Public Methods Specification

### Underwriter & Policy Management

#### `create_policy_pool`
```python
@gl.public.write.payable
def create_policy_pool(
    self,
    title: str,
    description: str,
    policy_terms: str,
    max_claim_cap: u256,
    min_claimant_stake: u256,
    review_window_seconds: u64,
    defense_window_seconds: u64
) -> u256
```
- **Requirements:**
  - `msg.value > 0`: Must fund initial indemnity escrow capital.
  - `title`: 3-120 chars.
  - `description`: 20-3000 chars.
  - `policy_terms`: 20-5000 chars (explicit covered perils and exclusions).
  - `max_claim_cap > 0` and `max_claim_cap <= msg.value`.
  - `min_claimant_stake > 0`.
  - `review_window_seconds >= 60` (min 1 minute; typical 86,400s / 24h).
  - `defense_window_seconds >= 60` (min 1 minute; typical 86,400s / 24h).
- **Effects:** Creates `PolicyPool` record; returns generated `pool_id`.

#### `fund_policy_pool`
```python
@gl.public.write.payable
def fund_policy_pool(self, policy_id: u256) -> None
```
- **Requirements:** `policy_id` exists; `policy.status == 'active'`; `msg.value > 0`.
- **Effects:** Adds `msg.value` to `policy.total_escrow_pool`.

#### `archive_policy_pool`
```python
@gl.public.write
def archive_policy_pool(self, policy_id: u256) -> None
```
- **Requirements:**
  - `gl.message.sender == policy.underwriter`.
  - `policy.status == 'active'`.
  - `policy.active_claims_count == 0` (no unfinalized claims).
- **Effects:**
  - Refunds 100% of remaining `policy.total_escrow_pool` to underwriter via `emit_transfer`.
  - Sets `policy.total_escrow_pool = 0`.
  - Sets `policy.status = 'archived'`.

---

### Claim Lifecycle & Adjudication

#### `file_claim`
```python
@gl.public.write.payable
def file_claim(
    self,
    policy_id: u256,
    damage_title: str,
    damage_description: str,
    repair_estimate_url: str,
    incident_proof_url: str,
    claimed_amount: u256
) -> u256
```
- **Requirements:**
  - `policy.status == 'active'`.
  - `msg.value >= policy.min_claimant_stake`.
  - `claimed_amount > 0` and `claimed_amount <= policy.max_claim_cap`.
  - `policy.total_escrow_pool >= claimed_amount` (solvency invariant).
  - `repair_estimate_url` and `incident_proof_url`: Valid public HTTPS URLs passing anti-SSRF checks.
  - `repair_estimate_url` not in `rewarded_evidence` or `active_evidence`.
  - Caller cannot be `policy.underwriter` (no self-claims).
- **Effects:**
  - Any excess stake `msg.value - policy.min_claimant_stake` is refunded immediately to claimant.
  - Commits `claimed_amount` by deducting from `policy.total_escrow_pool`.
  - Increments `policy.active_claims_count`.
  - Marks evidence in `active_evidence`.
  - Sets `claim.review_deadline = now + policy.review_window_seconds`.
  - Returns `claim_id`.

#### `approve_claim`
```python
@gl.public.write
def approve_claim(self, claim_id: u256) -> None
```
- **Requirements:** `gl.message.sender == policy.underwriter`; `claim.status == 'submitted'`.
- **Effects:**
  - Transfers 100% `claim.claimed_amount` to claimant.
  - Refunds 100% `claim.claimant_stake` to claimant.
  - Sets `claim.status = 'approved'`.
  - Decrements `policy.active_claims_count`; increments `policy.settled_claims_count`.

#### `claim_uncontested_payout`
```python
@gl.public.write
def claim_uncontested_payout(self, claim_id: u256) -> None
```
- **Requirements:**
  - `gl.message.sender == claim.claimant`.
  - `claim.status == 'submitted'`.
  - `now >= claim.review_deadline` (underwriter failed to contest in time).
- **Effects:**
  - Transfers 100% `claim.claimed_amount` to claimant.
  - Refunds 100% `claim.claimant_stake` to claimant.
  - Sets `claim.status = 'approved'`.

#### `contest_claim`
```python
@gl.public.write.payable
def contest_claim(self, claim_id: u256, contest_reason: str) -> None
```
- **Requirements:**
  - `gl.message.sender == policy.underwriter`.
  - `claim.status == 'submitted'`.
  - `now < claim.review_deadline`.
  - `msg.value >= claim.claimant_stake` (underwriter dispute deposit requirement).
  - `len(contest_reason) >= 20`.
- **Effects:**
  - Refunds any excess deposit over `claim.claimant_stake` to underwriter.
  - Locks deposit in `claim.underwriter_deposit`.
  - Sets `claim.contest_reason = contest_reason`.
  - Sets `claim.defense_deadline = now + policy.defense_window_seconds`.
  - Sets `claim.status = 'contested'`.

#### `submit_defense`
```python
@gl.public.write
def submit_defense(self, claim_id: u256, defense_rebuttal: str, waive_remaining_time: bool) -> None
```
- **Requirements:**
  - `gl.message.sender == claim.claimant`.
  - `claim.status == 'contested'`.
  - `now < claim.defense_deadline`.
  - `len(defense_rebuttal) >= 20`.
- **Effects:**
  - Sets `claim.defense_rebuttal = defense_rebuttal`.
  - If `waive_remaining_time == True`, sets `claim.defense_deadline = now`.
  - Sets `claim.status = 'defended'`.

#### `adjudicate_claim`
```python
@gl.public.write
def adjudicate_claim(self, claim_id: u256) -> None
```
- **Requirements:**
  - `claim.status in ('contested', 'defended')`.
  - `now >= claim.defense_deadline`.
  - Retry cooldown elapsed if previous attempt returned `UNDETERMINED`.
- **Execution Workflow:**
  1. Validators fetch weather/incident proof (`incident_proof_url`) and repair quote (`repair_estimate_url`).
  2. If either link returns HTTP 404/410, marks evidence defective, executes fast-path fraud slash.
  3. If servers return HTTP 429/5xx, sets status to `undetermined` with 30s cooldown.
  4. Validators execute AI Magistrate prompt in consensus under Equivalence Principle (`gl.eq_principle_strict_eq`).
  5. Enforces validator consensus on criteria counts, canonical verdict, and settlement BPS.
  6. Disburses proportional payout via continuous Basis Points math.
  7. Sets `claim.status = 'resolved'`.

#### `resolve_exhausted_claim`
```python
@gl.public.write
def resolve_exhausted_claim(self, claim_id: u256) -> None
```
- **Requirements:**
  - `claim.status in ('contested', 'defended')`.
  - `claim.attempt_count >= 5` OR `now - claim.submitted_at >= 86400`.
- **Effects:**
  - Returns `claim.claimant_stake` 100% to claimant.
  - Returns `claim.underwriter_deposit` 100% to underwriter.
  - Re-credits `claim.claimed_amount` back to `policy.total_escrow_pool`.
  - Decrements `policy.active_claims_count`.
  - Removes evidence from `active_evidence`.
  - Sets `claim.status = 'exhausted'`.

---

## 3. View Methods

- `get_policy_pool(policy_id: u256) -> dict`
- `get_claim(claim_id: u256) -> dict`
- `get_verdict(verdict_id: u32) -> dict`
- `get_total_policy_pools() -> int`
- `get_total_claims() -> int`
- `get_total_verdicts() -> int`
- `get_policy_claims(policy_id: u256, offset: int, limit: int) -> list[dict]`
- `get_claimant_claims(claimant_address: Address) -> list[dict]`
- `get_contract_version() -> str`
