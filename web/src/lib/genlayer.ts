import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { Claim, PolicyPool, Verdict } from "@/types/damageassesscourt";
import { pollTransactionUntilFinalized, FinalizedTransactionReceipt } from "./tx-waiter";

export { pollTransactionUntilFinalized };
export type { FinalizedTransactionReceipt };

export const DAMAGEASSESSCOURT_CONTRACT_ADDRESS: `0x${string}` =
  (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`) ||
  "0x1e4d9Ef20330636F289Aa550C2ED07030e5b93Fb";

// Alias for convenience
export const DAMAGE_ASSESS_COURT_ADDRESS = DAMAGEASSESSCOURT_CONTRACT_ADDRESS;

export const STUDIONET_RPC = process.env.NEXT_PUBLIC_GENLAYER_RPC_URL || "https://studio.genlayer.com/api";
export const STUDIONET_CHAIN_ID = Number(process.env.NEXT_PUBLIC_GENLAYER_CHAIN_ID || "61999");

export function getPublicClient() {
  return createClient({
    chain: studionet,
    endpoint: STUDIONET_RPC,
  });
}

// Fallback demo data for immediate UI rendering before deployment or during preview
export const DEMO_POLICIES: PolicyPool[] = [
  {
    id: 1,
    underwriter: "0xB704b624ae5f776b3a3fA7496aDcdA4dB4DCAB56",
    title: "Gulf Coast Commercial Wind & Storm Surge Pool",
    description: "Primary commercial indemnity facility protecting industrial warehouses against Category 1-5 hurricanes, roof shear, and structural rainwater intrusion.",
    policy_terms: "Perils Covered: Windstorm damage exceeding 50mph, torrential rainwater intrusion following structural envelope opening, debris mitigation. Exclusions: Pre-existing structural wear, unmitigated rot, rust, and normal cosmetic aging.",
    policy_terms_text: "Perils Covered: Windstorm damage exceeding 50mph, torrential rainwater intrusion following structural envelope opening, debris mitigation. Exclusions: Pre-existing structural wear, unmitigated rot, rust, and normal cosmetic aging.",
    covered_perils: ["Hurricane & Windstorm (Category 1-5)", "Torrential Rain Ingress", "Debris Clearance"],
    deductible_bps: 500,
    total_escrow_pool: 250_000,
    max_claim_cap: 50_000,
    min_claimant_stake: 1_000,
    review_window_seconds: 86_400,
    defense_window_seconds: 86_400,
    status: "active",
    is_active: true,
    active_claims_count: 2,
    settled_claims_count: 4,
    total_payout_disbursed: 68_500,
    created_at: Math.floor(Date.now() / 1000) - 86400 * 5,
  },
  {
    id: 2,
    underwriter: "0x2bd806c97F0e00aF1a1fC3328fA763a9269723C8",
    title: "Midwest Logistics Facility Hail & Severe Convective Risk Pool",
    description: "Dedicated coverage for logistics hubs, distribution centers, and commercial solar arrays against severe hail and localized convective wind damage.",
    policy_terms: "Perils Covered: Hail impact diameter > 1.25 inches, convective wind gust damage, skylight shatter. Exclusions: Mechanical breakdown, pre-existing roof blistering, wear and tear.",
    policy_terms_text: "Perils Covered: Hail impact diameter > 1.25 inches, convective wind gust damage, skylight shatter. Exclusions: Mechanical breakdown, pre-existing roof blistering, wear and tear.",
    covered_perils: ["Hail Impact (>1.25 inches)", "Convective Wind Gusts", "Skylight Penetration"],
    deductible_bps: 750,
    total_escrow_pool: 150_000,
    max_claim_cap: 35_000,
    min_claimant_stake: 1_500,
    review_window_seconds: 86_400,
    defense_window_seconds: 86_400,
    status: "active",
    is_active: true,
    active_claims_count: 1,
    settled_claims_count: 2,
    total_payout_disbursed: 30_000,
    created_at: Math.floor(Date.now() / 1000) - 86400 * 12,
  },
];

export const DEMO_CLAIMS: Claim[] = [
  {
    id: 1,
    policy_id: 1,
    claimant: "0x81b637d8fCD2C6da6359E6963113a1170de795e4",
    damage_title: "Bay 3 Warehouse Roof Breach & Interior Stock Flooding",
    damage_description: "During Hurricane landfall, sustained 81.4 mph gusts sheared the eastern roof membrane on Bay 3, resulting in severe roof penetration and torrential flooding of inventory.",
    repair_estimate_url: "https://contractor.repair.example.com/estimates/quote-88219.json",
    incident_proof_url: "https://noaa.weather.example.gov/storm-logs/gulf-oct-2026.json",
    evidence_urls: [
      "https://contractor.repair.example.com/estimates/quote-88219.json",
      "https://noaa.weather.example.gov/storm-logs/gulf-oct-2026.json",
    ],
    evidence_hash: "a4f89d3421e8b901fc45a32b90ce8812a4df8921be4a2c0199e43a9b1c0451e2",
    claimed_amount: 10_000,
    claimant_stake: 1_000,
    underwriter_deposit: 1_000,
    settlement_bps: 6850,
    approved_payout: 6_850,
    status: "defended",
    contest_reason: "Contractor estimate appears to include pre-existing rusted structural beams and cosmetic siding replacement.",
    defense_rebuttal: "Rusted fasteners were ancillary; the hurricane winds tore off new membrane panels installed in 2025 as verified by invoice line items.",
    attempt_count: 0,
    verdict_id: 0,
    submitted_at: Math.floor(Date.now() / 1000) - 86400 * 2,
    review_deadline: Math.floor(Date.now() / 1000) - 86400 * 1,
    defense_deadline: Math.floor(Date.now() / 1000) + 43200,
    resolved_at: 0,
  },
  {
    id: 2,
    policy_id: 1,
    claimant: "0x776773Cb27a43dFb074aB8Bde8bB7F776aBa0fFf",
    damage_title: "Distribution Center South Dock Wind Damage & Water Ingress",
    damage_description: "High velocity wind gusts fractured dock door seal and water inundated warehouse electronics staging area.",
    repair_estimate_url: "https://contractor.repair.example.com/estimates/dock-surge-4412.json",
    incident_proof_url: "https://noaa.weather.example.gov/storm-logs/gulf-oct-2026.json",
    evidence_urls: [
      "https://contractor.repair.example.com/estimates/dock-surge-4412.json",
      "https://noaa.weather.example.gov/storm-logs/gulf-oct-2026.json",
    ],
    evidence_hash: "b9821cde04419ad21fb443810ecda4598124018ca2310de45f8910beccab3412",
    claimed_amount: 15_000,
    claimant_stake: 1_000,
    underwriter_deposit: 1_000,
    settlement_bps: 6850,
    approved_payout: 10_275,
    status: "resolved",
    contest_reason: "Disputing whether dock door failed due to deferred maintenance or wind pressure.",
    defense_rebuttal: "Door was serviced within 90 days with certified weatherproofing record.",
    attempt_count: 1,
    verdict_id: 1,
    submitted_at: Math.floor(Date.now() / 1000) - 86400 * 4,
    review_deadline: Math.floor(Date.now() / 1000) - 86400 * 3,
    defense_deadline: Math.floor(Date.now() / 1000) - 86400 * 2,
    resolved_at: Math.floor(Date.now() / 1000) - 86400 * 1,
  },
];

export const DEMO_VERDICTS: Verdict[] = [
  {
    id: 1,
    claim_id: 2,
    policy_id: 1,
    canonical_verdict: "PARTIAL_SETTLEMENT",
    settlement_bps: 6850,
    covered_criteria_count: 2,
    excluded_criteria_count: 1,
    partial_criteria_count: 0,
    undetermined_criteria_count: 0,
    ruling_summary: "68.5% approved for storm membrane tear and dock water ingress. 31.5% deducted for pre-existing rust exclusion.",
    calculation_breakdown: "6850 BPS: $10,275 indemnity approved to claimant; $4,725 retained by insurer pool. Claimant stake refunded. Underwriter deposit refunded.",
    evidence_verification_note: "NOAA sustained wind verified at 81.4 mph; contractor estimate verified legitimate.",
    ruled_at: Math.floor(Date.now() / 1000) - 86400 * 1,
  },
];

function parsePolicyRecord(raw: Record<string, unknown>): PolicyPool {
  const terms = String(raw.policy_terms || "");
  return {
    id: Number(raw.id),
    underwriter: String(raw.underwriter || ""),
    title: String(raw.title || ""),
    description: String(raw.description || ""),
    policy_terms: terms,
    policy_terms_text: terms,
    covered_perils: Array.isArray(raw.covered_perils)
      ? (raw.covered_perils as string[])
      : ["Hurricane & Windstorm", "Hail Impact", "Pipe Ingress"],
    deductible_bps: Number(raw.deductible_bps || 500),
    total_escrow_pool: raw.total_escrow_pool?.toString() || "0",
    max_claim_cap: raw.max_claim_cap?.toString() || "0",
    max_claim_limit: raw.max_claim_cap?.toString() || "0",
    min_claimant_stake: raw.min_claimant_stake?.toString() || "0",
    review_window_seconds: Number(raw.review_window_seconds || 86400),
    defense_window_seconds: Number(raw.defense_window_seconds || 86400),
    status: (raw.status as PolicyPool["status"]) || "active",
    is_active: raw.status === "active" || raw.is_active === true,
    active_claims_count: Number(raw.active_claims_count || 0),
    settled_claims_count: Number(raw.settled_claims_count || 0),
    total_payout_disbursed: raw.total_payout_disbursed?.toString() || "0",
    created_at: Number(raw.created_at || 0),
  };
}

function parseClaimRecord(raw: Record<string, unknown>): Claim {
  const repairUrl = String(raw.repair_estimate_url || "");
  const incidentUrl = String(raw.incident_proof_url || "");
  const urls = [repairUrl, incidentUrl].filter(Boolean);

  return {
    id: Number(raw.id),
    policy_id: Number(raw.policy_id),
    claimant: String(raw.claimant || ""),
    damage_title: String(raw.damage_title || ""),
    damage_description: String(raw.damage_description || ""),
    repair_estimate_url: repairUrl,
    incident_proof_url: incidentUrl,
    evidence_urls: urls,
    evidence_hash: String(raw.evidence_hash || ""),
    claimed_amount: raw.claimed_amount?.toString() || "0",
    claimant_stake: raw.claimant_stake?.toString() || "0",
    underwriter_deposit: raw.underwriter_deposit?.toString() || "0",
    settlement_bps: Number(raw.settlement_bps || 0),
    approved_payout: raw.approved_payout ? Number(raw.approved_payout) : undefined,
    status: (raw.status as Claim["status"]) || "submitted",
    contest_reason: String(raw.contest_reason || ""),
    defense_rebuttal: String(raw.defense_rebuttal || ""),
    attempt_count: Number(raw.attempt_count || 0),
    verdict_id: Number(raw.verdict_id || 0),
    submitted_at: Number(raw.submitted_at || 0),
    review_deadline: Number(raw.review_deadline || 0),
    defense_deadline: Number(raw.defense_deadline || 0),
    resolved_at: Number(raw.resolved_at || 0),
  };
}

function parseVerdictRecord(raw: Record<string, unknown>): Verdict {
  return {
    id: Number(raw.id),
    claim_id: Number(raw.claim_id),
    policy_id: Number(raw.policy_id),
    canonical_verdict: (raw.canonical_verdict as Verdict["canonical_verdict"]) || "CLAIM_DENIED",
    settlement_bps: Number(raw.settlement_bps || 0),
    covered_criteria_count: Number(raw.covered_criteria_count || 0),
    excluded_criteria_count: Number(raw.excluded_criteria_count || 0),
    partial_criteria_count: Number(raw.partial_criteria_count || 0),
    undetermined_criteria_count: Number(raw.undetermined_criteria_count || 0),
    ruling_summary: String(raw.ruling_summary || ""),
    calculation_breakdown: String(raw.calculation_breakdown || ""),
    evidence_verification_note: String(raw.evidence_verification_note || ""),
    ruled_at: Number(raw.ruled_at || 0),
  };
}

export async function fetchAllPolicies(offset: number = 0, limit: number = 50): Promise<{ policies: PolicyPool[]; isFallback: boolean }> {
  if (!DAMAGEASSESSCOURT_CONTRACT_ADDRESS || DAMAGEASSESSCOURT_CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
    return { policies: DEMO_POLICIES, isFallback: true };
  }

  try {
    const client = getPublicClient();
    const result = await client.readContract({
      address: DAMAGEASSESSCOURT_CONTRACT_ADDRESS,
      functionName: "get_all_policies",
      args: [offset, limit],
    });

    if (Array.isArray(result) && result.length > 0) {
      return { policies: result.map((r) => parsePolicyRecord(r as Record<string, unknown>)), isFallback: false };
    }
    return { policies: DEMO_POLICIES, isFallback: true };
  } catch (err) {
    console.warn("Failed fetching policies from RPC, falling back to demo data:", err);
    return { policies: DEMO_POLICIES, isFallback: true };
  }
}

export async function fetchPolicyPool(policyId: number): Promise<{ policy: PolicyPool | null; isFallback: boolean }> {
  if (!DAMAGEASSESSCOURT_CONTRACT_ADDRESS || DAMAGEASSESSCOURT_CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
    const found = DEMO_POLICIES.find((p) => p.id === policyId) || null;
    return { policy: found, isFallback: true };
  }

  try {
    const client = getPublicClient();
    const result = await client.readContract({
      address: DAMAGEASSESSCOURT_CONTRACT_ADDRESS,
      functionName: "get_policy_pool",
      args: [BigInt(policyId)],
    });

    if (result && typeof result === "object") {
      return { policy: parsePolicyRecord(result as Record<string, unknown>), isFallback: false };
    }
    return { policy: null, isFallback: false };
  } catch (err) {
    console.warn(`Failed fetching policy ${policyId} from RPC:`, err);
    const found = DEMO_POLICIES.find((p) => p.id === policyId) || null;
    return { policy: found, isFallback: true };
  }
}

export async function fetchClaim(claimId: number): Promise<{ claim: Claim | null; isFallback: boolean }> {
  if (!DAMAGEASSESSCOURT_CONTRACT_ADDRESS || DAMAGEASSESSCOURT_CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
    const found = DEMO_CLAIMS.find((c) => c.id === claimId) || null;
    return { claim: found, isFallback: true };
  }

  try {
    const client = getPublicClient();
    const result = await client.readContract({
      address: DAMAGEASSESSCOURT_CONTRACT_ADDRESS,
      functionName: "get_claim",
      args: [BigInt(claimId)],
    });

    if (result && typeof result === "object") {
      return { claim: parseClaimRecord(result as Record<string, unknown>), isFallback: false };
    }
    return { claim: null, isFallback: false };
  } catch (err) {
    console.warn(`Failed fetching claim ${claimId} from RPC:`, err);
    const found = DEMO_CLAIMS.find((c) => c.id === claimId) || null;
    return { claim: found, isFallback: true };
  }
}

export async function fetchPolicyClaims(policyId: number): Promise<{ claims: Claim[]; isFallback: boolean }> {
  if (!DAMAGEASSESSCOURT_CONTRACT_ADDRESS || DAMAGEASSESSCOURT_CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
    const filtered = DEMO_CLAIMS.filter((c) => c.policy_id === policyId);
    return { claims: filtered, isFallback: true };
  }

  try {
    const client = getPublicClient();
    const result = await client.readContract({
      address: DAMAGEASSESSCOURT_CONTRACT_ADDRESS,
      functionName: "get_policy_claims",
      args: [BigInt(policyId), 0, 50],
    });

    if (Array.isArray(result) && result.length > 0) {
      return { claims: result.map((r) => parseClaimRecord(r as Record<string, unknown>)), isFallback: false };
    }
    const filtered = DEMO_CLAIMS.filter((c) => c.policy_id === policyId);
    return { claims: filtered, isFallback: true };
  } catch (err) {
    console.warn(`Failed fetching policy claims for policy ${policyId}:`, err);
    const filtered = DEMO_CLAIMS.filter((c) => c.policy_id === policyId);
    return { claims: filtered, isFallback: true };
  }
}

export async function fetchVerdict(verdictId: number): Promise<{ verdict: Verdict | null; isFallback: boolean }> {
  if (!verdictId || verdictId === 0) return { verdict: null, isFallback: false };

  if (!DAMAGEASSESSCOURT_CONTRACT_ADDRESS || DAMAGEASSESSCOURT_CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
    const found = DEMO_VERDICTS.find((v) => v.id === verdictId) || null;
    return { verdict: found, isFallback: true };
  }

  try {
    const client = getPublicClient();
    const result = await client.readContract({
      address: DAMAGEASSESSCOURT_CONTRACT_ADDRESS,
      functionName: "get_verdict",
      args: [verdictId],
    });

    if (result && typeof result === "object") {
      return { verdict: parseVerdictRecord(result as Record<string, unknown>), isFallback: false };
    }
    return { verdict: null, isFallback: false };
  } catch (err) {
    console.warn(`Failed fetching verdict ${verdictId} from RPC:`, err);
    const found = DEMO_VERDICTS.find((v) => v.id === verdictId) || null;
    return { verdict: found, isFallback: true };
  }
}

export async function fetchTotals(): Promise<{ policyCount: number; claimCount: number; verdictCount: number }> {
  if (!DAMAGEASSESSCOURT_CONTRACT_ADDRESS || DAMAGEASSESSCOURT_CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
    return {
      policyCount: DEMO_POLICIES.length,
      claimCount: DEMO_CLAIMS.length,
      verdictCount: DEMO_VERDICTS.length,
    };
  }

  try {
    const client = getPublicClient();
    const [pCount, cCount, vCount] = await Promise.all([
      client.readContract({
        address: DAMAGEASSESSCOURT_CONTRACT_ADDRESS,
        functionName: "get_total_policy_pools",
        args: [],
      }),
      client.readContract({
        address: DAMAGEASSESSCOURT_CONTRACT_ADDRESS,
        functionName: "get_total_claims",
        args: [],
      }),
      client.readContract({
        address: DAMAGEASSESSCOURT_CONTRACT_ADDRESS,
        functionName: "get_total_verdicts",
        args: [],
      }),
    ]);

    return {
      policyCount: Number(pCount || 0),
      claimCount: Number(cCount || 0),
      verdictCount: Number(vCount || 0),
    };
  } catch (err) {
    console.warn("Failed fetching totals from RPC:", err);
    return {
      policyCount: DEMO_POLICIES.length,
      claimCount: DEMO_CLAIMS.length,
      verdictCount: DEMO_VERDICTS.length,
    };
  }
}

// ---------------------------------------------------------------------
// Write Operations
// ---------------------------------------------------------------------

export async function createPolicyPool(
  title: string,
  description: string,
  policyTerms: string,
  coveredPerils: string[],
  escrowWei: bigint,
  maxCapWei: bigint,
  minStakeWei: bigint,
  deductibleBps: number,
  onStatusUpdate?: (status: "signing" | "broadcasting" | "waiting", update?: string) => void
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("No Web3 wallet extension detected.");
    }

    const client = createClient({
      chain: studionet,
      endpoint: STUDIONET_RPC,
    });

    onStatusUpdate?.("signing", "Requesting wallet confirmation...");

    const reviewSeconds = 86400n;
    const defenseSeconds = 86400n;

    const txHash = await client.writeContract({
      address: DAMAGEASSESSCOURT_CONTRACT_ADDRESS,
      functionName: "create_policy_pool",
      args: [
        title.trim(),
        description.trim(),
        policyTerms.trim(),
        maxCapWei,
        minStakeWei,
        reviewSeconds,
        defenseSeconds,
      ],
      value: escrowWei,
    });

    onStatusUpdate?.("waiting", "Transaction broadcast. Waiting for GenLayer finality...");
    await pollTransactionUntilFinalized(txHash, (update) => onStatusUpdate?.("waiting", update));

    return { success: true, txHash };
  } catch (err: unknown) {
    console.error("Failed creating policy pool:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

export async function fileClaim(
  policyId: number,
  damageTitle: string,
  damageDescription: string,
  claimedWei: bigint,
  stakeWei: bigint,
  evidenceUrls: string[],
  onStatusUpdate?: (status: "signing" | "broadcasting" | "waiting", update?: string) => void
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("No Web3 wallet extension detected.");
    }

    const client = createClient({
      chain: studionet,
      endpoint: STUDIONET_RPC,
    });

    onStatusUpdate?.("signing", "Requesting wallet confirmation...");

    const repairUrl = evidenceUrls[0] || "https://ipfs.io/ipfs/bafybeirepairexample";
    const incidentUrl = evidenceUrls[1] || "https://noaa.weather.example.gov/incident-log.pdf";

    const txHash = await client.writeContract({
      address: DAMAGEASSESSCOURT_CONTRACT_ADDRESS,
      functionName: "file_claim",
      args: [
        BigInt(policyId),
        damageTitle.trim(),
        damageDescription.trim(),
        repairUrl.trim(),
        incidentUrl.trim(),
        claimedWei,
      ],
      value: stakeWei,
    });

    onStatusUpdate?.("waiting", "Claim broadcast. Waiting for GenLayer finality...");
    await pollTransactionUntilFinalized(txHash, (update) => onStatusUpdate?.("waiting", update));

    return { success: true, txHash };
  } catch (err: unknown) {
    console.error("Failed filing claim:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}
