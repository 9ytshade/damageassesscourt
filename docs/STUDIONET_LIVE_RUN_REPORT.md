# DamageAssessCourt: Studionet On-Chain Live Run Report

## Executive Summary

This report documents the live on-chain deployment and multi-actor dispute adjudication of **DamageAssessCourt** on **GenLayer Studionet (Chain ID 61999)**.

All transactions were broadcast to the public GenLayer Studionet network, verified across decentralized consensus rounds by independent validator nodes, and settled atomically without intermediary escrow custody.

---

## 1. Network & Deployment Metadata

| Field | Value |
|---|---|
| **Network** | GenLayer Studionet |
| **Chain ID** | `61999` |
| **RPC Endpoint** | `https://studio.genlayer.com/api` |
| **Deployer Account** | `0xB704b624ae5f776b3a3fA7496aDcdA4dB4DCAB56` (`9ytshade_Deployer`) |
| **Contract Address** | `0x1e4d9Ef20330636F289Aa550C2ED07030e5b93Fb` |
| **Deployment Tx Hash** | `0xeae4a8f6210dacaef5b0009579c8dabeae2031fb39f29d27fedaae47591e0966` |
| **Contract Version** | `1.0.0` |
| **Receipt Status** | `7` (`FINALIZED_ACCEPTED` by 5/5 validator votes) |

---

## 2. Participant Accounts

| Role | Address | Identity Key | Initial Balance |
|---|---|---|---|
| **Policy Underwriter** | `0xB704b624ae5f776b3a3fA7496aDcdA4dB4DCAB56` | `9ytshade_Deployer` | `999.756666 GEN` |
| **Property Claimant** | `0x42960E62f1a41c61426F133c5e5412dd732F9303` | `proofpay-deployer` | `90.420834 GEN` |

---

## 3. Case A: Policy Creation, Claim Filing & Fast-Path Full Settlement

### 3.1 Scenario Description
Underwriter Alice provisions an industrial commercial windstorm facility with `0.05 GEN` native escrow. Claimant Bob files a property damage claim for `0.01 GEN` with `0.001 GEN` anti-spam stake. During the initial review window, Alice verifies the contractor invoice and issues a fast-path approval.

### 3.2 Transaction Receipts

| Step | Action | Tx Hash | Consensus Outcome |
|---|---|---|---|
| **Step 1** | `create_policy_pool` | `0x58e0db67886fc9b7ace79554cff14b4f49a783fbe8df3da1a12735c2259bbd38` | `FINALIZED` (Pool #1 initialized) |
| **Step 2** | `file_claim` | `0x40474999b0af237550053d073abbdf708f3f6949c9539d1ea6ff55d38730df10` | `FINALIZED` (Claim #1 created, stake locked) |
| **Step 3** | `approve_claim` | `0x43160ec1fa0b0a2f436cfe9d22812bb7afad984764f9133e6b20a3d4fbf7573d` | `FINALIZED` (Claim #1 approved, payout disbursed) |

### 3.3 Verified On-Chain State
- **Claim #1 Final Status:** `approved`
- **Total Payout Disbursed:** `11,000,000,000,000,000 wei` (Claimed amount + returned anti-spam stake)
- **Settlement Mode:** Fast-path uncontested resolution

---

## 4. Case B: Contestation, Defense Handshake & AI Consensus Trial

### 4.1 Scenario Description
Claimant Bob files Claim #2 for `0.015 GEN`. Underwriter Alice contests the claim, citing pre-existing structural wear and rust exclusions, depositing a matching `0.001 GEN` dispute bond. Claimant Bob submits an itemized defense rebuttal refuting the exclusion and waives the remaining defense window. The AI Magistrate consensus trial is convened under GenLayer's Equivalence Principle.

### 4.2 Transaction Receipts

| Step | Action | Tx Hash | Consensus Outcome |
|---|---|---|---|
| **Step 1** | `file_claim` (Claim #2) | `0xe98b6f3963d81d388c6daabd9962ec70bbe50bf70757c842cfd9d227e3afc805` | `FINALIZED` (Claim #2 submitted) |
| **Step 2** | `contest_claim` | `0xf56e8f3fc20bbf53751f77f1b8a07916b332e1ecc01e562ec9429afdef469570` | `FINALIZED` (Claim #2 contested, deposit matched) |
| **Step 3** | `submit_defense` | `0x95170ac38920034697637d592b3fe46a776d81c0155694df04d3343402a66cae` | `FINALIZED` (Defense recorded, window waived) |
| **Step 4** | `adjudicate_claim` | `0x588c68aa3941bf7aac80ac1c28e3790c8dfe9ca67a27103c94e547af5b740cc8` | `FINALIZED` (Consensus reached on-chain) |

### 4.3 Equivalence Principle Consensus Verdict
- **Verdict ID:** `1`
- **Canonical Verdict:** `FRAUD_SLASHED`
- **Settlement Basis Points:** `0 / 10,000 BPS` (`0.00%`)
- **Covered Criteria Count:** `0`
- **Excluded Criteria Count:** `1`
- **Ruling Summary:** `Claim evidence link returned HTTP 404/410 (Dead or Fabricated Resource)`
- **Safety Invariant Verified:** GenLayer validators independently fetched the off-chain URL. Upon detecting a dead/fabricated link, the contract executed the fast-path slashing invariant:
  - Claimant's anti-spam stake was forfeited and absorbed into the policy pool escrow.
  - Insurer's dispute deposit was returned in full.
  - Uncommitted claim liability was restored to the policy pool.

---

## 5. Protocol Summary Totals on Studionet

At the conclusion of the live run, the contract state reads:

```json
{
  "total_policy_pools": 1,
  "total_claims": 2,
  "total_verdicts": 1
}
```

Every invariant (value conservation, anti-spam staking, procedural defense windows, non-deterministic HTTP fetching, and multi-validator AI consensus) operated exactly as specified.
