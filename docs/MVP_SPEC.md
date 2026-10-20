# DamageAssessCourt: Minimum Viable Product (MVP) Specification

## 1. Executive Summary

DamageAssessCourt is an autonomous, AI-native insurance claim arbitration and damage assessment protocol built on GenLayer Intelligent Contracts.

In the global insurance market, over 95% of property, casualty, and commercial damage claims cannot be automated through simple parametric smart contracts (such as flight delay or rainfall sensors). Real-world claims involve ambiguous policy wording, subjective causation analysis (e.g. hurricane wind damage versus pre-existing structural wear), third-party contractor repair estimates, and local incident records. 

Today, traditional insurance carriers require 30 to 90 days to adjust claims manually. This system suffers from high administrative overhead, fraud vulnerability, and an inherent conflict of interest: insurance carriers maximize profitability by delaying or denying payouts.

DamageAssessCourt introduces an on-chain, consensus-driven AI claims courtroom. Policyholders file claims with itemized contractor repair estimates, incident/weather verification links, and damage narratives against on-chain policy pools. GenLayer validator magistrates independently fetch public web evidence, interpret policy terms under the Equivalence Principle, and execute mathematically bounded continuous Basis Points (0-10,000 BPS) settlements in minutes.

---

## 2. Target Network & Toolchain

- **Protocol Name:** DamageAssessCourt
- **Blockchain Network:** GenLayer Studionet
- **Chain ID:** `61999`
- **RPC Endpoint:** `https://studio.genlayer.com/api`
- **Deployer Account (9ytshade):** `0xB704b624ae5f776b3a3fA7496aDcdA4dB4DCAB56` (`9ytshade_Deployer`)
- **Intelligent Contract Framework:** Python 3.12+ / GenVM
- **Consensus Primitive:** Equivalence Principle (`gl.eq_principle_strict_eq`)
- **Frontend Architecture:** Next.js 16 (App Router), React 19, Tailwind CSS 4, `genlayer-js` 1.1.8+
- **Design System:** Dovetail Design Language (Carbon `#0a0a0a`, Graphite `#141414`, Iron `#1e1e1e`, Accent Blue `#6798ff`)

---

## 3. Core Protocol Personas & Actors

1. **Policy Underwriter (Insurer / Liquidity Pool Sponsor):**
   - Creates a criteria-governed policy pool (`create_policy_pool`).
   - Deposits initial indemnity escrow capital into the pool.
   - Defines policy terms, covered perils, exclusion clauses, per-claim payout caps, review windows, and required claimant stakes.
   - Exercises fast-path approval (`approve_claim`) or contests claims with specific exclusion grievances (`contest_claim`).
   - Recovers 100% of uncommitted pool capital upon policy archival (`archive_policy_pool`).

2. **Policyholder (Claimant):**
   - Files a damage claim (`file_claim`) against an active policy pool.
   - Deposits an anti-spam stake (`min_claimant_stake`) to ensure skin-in-the-game.
   - Submits verifiable evidence: narrative description, itemized contractor repair quote URL, and official incident/weather proof URL.
   - Claims 100% payout via timeout if the underwriter fails to contest within the review window (`claim_uncontested_payout`).
   - Submits counter-evidence during the guaranteed defense window if contested (`submit_defense`).

3. **GenLayer Validator Magistrates (AI Courtroom Jury):**
   - Execute non-deterministic web fetches to retrieve external weather/incident reports and contractor quotes (`gl.nondet.web.get`).
   - Quarantine all untrusted inputs within strict XML enclosures to prevent prompt injection.
   - Evaluate policy terms against evidence under the Equivalence Principle.
   - Score covered, excluded, partial, and undetermined criteria counts.
   - Formulate canonical verdicts and continuous settlement percentages (0 to 10,000 BPS).
   - Ensure Byzantine agreement on criteria counts and payout basis points before state transitions commit on-chain.

---

## 4. Architectural State Machine

```
[Underwriter: create_policy_pool]
  | (Deposits escrow pool, sets terms, exclusions, max_claim_cap, review window)
  v
[Active Policy Pool]
  |
  +--> [Claimant: file_claim]
        | (Locks anti-spam stake, attaches repair estimate URL + weather proof URL)
        v
      [Status: SUBMITTED]
        |
        +-- (Option 1) [Underwriter: approve_claim] (Fast-path 100% payout)
        |               v
        |             [Status: APPROVED] (100% Claim Cap disbursed, stake returned)
        |
        +-- (Option 2) [Review Window Expires Uncontested]
        |               v
        |             [Claimant: claim_uncontested_payout] -> [Status: APPROVED]
        |
        +-- (Option 3) [Underwriter: contest_claim]
                        | (Locks dispute deposit, details exclusion clause breach)
                        v
                      [Status: CONTESTED]
                        |
                        +--> [Claimant: submit_defense]
                        |     | (Submits counter-evidence, waivers, or permits)
                        |     v
                        |   [Status: DEFENDED]
                        |
                        +--> [Defense Window Closes or Waived]
                              v
                            [Status: ADJUDICATING]
                              |
                              +--> [Anyone: adjudicate_claim]
                                    | (GenLayer AI Magistrates convene in consensus)
                                    | - Fetch public weather incident log
                                    | - Inspect contractor repair estimate JSON
                                    | - Audit policy terms and exclusion clauses
                                    | - Consensus derivation of Basis Points (0-10,000 BPS)
                                    v
                                  [Status: RESOLVED]
                                    +-- Proportional BPS indemnity payout to claimant
                                    +-- Unearned escrow retained by policy pool
                                    +-- Claimant stake returned (slashing safeguard)
                                    +-- Underwriter deposit returned
```

---

## 5. Continuous Basis Points (0-10,000 BPS) Indemnity Math

Insurance damage assessments are rarely all-or-nothing. Real-world damages frequently involve deductible subtraction, pre-existing wear depreciation, or mixed causation (e.g. 70% storm damage, 30% pre-existing deferred maintenance).

DamageAssessCourt calculates exact proportional indemnity using continuous Basis Points:

$$\text{indemnity\_payout} = \left\lfloor \frac{\text{claimed\_amount} \times \text{settlement\_bps}}{10000} \right\rfloor$$
$$\text{insurer\_retained} = \text{claimed\_amount} - \text{indemnity\_payout}$$

### Collateral & Stake Distribution Matrix

1. **Full Indemnity (`settlement_bps == 10000`):**
   - Claimant receives 100% of claimed amount.
   - Claimant anti-spam stake is refunded 100%.
   - Underwriter dispute deposit is awarded to claimant as recompense for unjustified dispute delay.

2. **Partial Settlement (`0 < settlement_bps < 10000`):**
   - Claimant receives `indemnity_payout`.
   - Insurer retains `insurer_retained` in policy pool.
   - Claimant anti-spam stake is refunded 100% (slashing safeguard for legitimate damage claims).
   - Underwriter dispute deposit is refunded 100%.

3. **Legitimate Exclusion Denial (`settlement_bps == 0`, No Fraud):**
   - Claim is denied due to verified policy exclusions (e.g. wear-and-tear).
   - Entire claimed amount is returned to the policy pool.
   - Claimant anti-spam stake is refunded 100% (slashing safeguard: honest claimants are not penalized for policy coverage misunderstandings).
   - Underwriter dispute deposit is refunded 100%.

4. **Fraudulent / Fabricated Claim (`canonical_verdict == FRAUD_SLASHED`):**
   - Evidence shows fabricated storm events, falsified contractor licenses, or doctored repair quotes.
   - Entire claimed amount is returned to the policy pool.
   - Claimant anti-spam stake is **permanently slashed** into the policy pool as liquidated damages.
   - Underwriter dispute deposit is refunded 100%.

In all cases, exact fund conservation is enforced:
$$\text{claimant\_payout} + \text{insurer\_retained} \equiv \text{total\_claim\_liability}$$
Zero residual balance leakage exists.

---

## 6. Formal Security & Reliability Invariants

1. **Anti-SSRF Validation:** All external proof URLs (repair estimates, weather logs) must use public HTTPS, port 443, and strictly disallow localhost, loopback, private RFC 1918 subnets, and cloud metadata endpoints.
2. **Strict XML Prompt Fencing:** Untrusted user text and fetched web bodies are fenced in `<policy_document>`, `<incident_record>`, `<repair_estimate>`, `<grievance>`, and `<rebuttal>` tags. Validators are commanded to treat enclosed contents as inert evidence.
3. **Transient Network Fault Tolerance:** If an external evidence server returns HTTP 429, 500, 502, 503, or 504, the adjudication records `UNDETERMINED`. Anti-spam stakes are never slashed during upstream outages.
4. **Authoritative Terminal Exhaustion Recovery:** If consecutive adjudication attempts return `UNDETERMINED` past 5 attempts (`MAX_RETRY_ATTEMPTS`) or 86,400 seconds (`EXHAUSTION_TIMEOUT_SECONDS`), anyone can call `resolve_exhausted_claim` to refund the claimant stake, refund the underwriter deposit, and unlock policy pool capital.
5. **Double-Spend & Duplicate Claim Prevention:** Evidence URL digests are tracked on-chain in `rewarded_evidence: TreeMap[str, bool]`, permanently preventing repeat bounty or indemnity payouts using the same invoice or event proof.
