import { BpsSettlementCalculation } from "@/types/damageassesscourt";

const PRIVATE_IP_PATTERNS = [
  /^localhost$/i,
  /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/,
  /^192\.168\.\d{1,3}\.\d{1,3}$/,
  /^169\.254\.\d{1,3}\.\d{1,3}$/,
  /^0\.0\.0\.0$/,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
];

export function validateEvidenceUrl(urlStr: string): { valid: boolean; error?: string } {
  const clean = urlStr.trim();
  if (!clean) {
    return { valid: false, error: "Evidence URL cannot be empty" };
  }
  if (clean.length > 2048) {
    return { valid: false, error: "Evidence URL exceeds maximum length of 2048 characters" };
  }

  let parsed: URL;
  try {
    parsed = new URL(clean);
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { valid: false, error: "URL protocol must be HTTP or HTTPS" };
  }

  if (parsed.username || parsed.password) {
    return { valid: false, error: "URLs containing user credentials are not allowed" };
  }

  const hostname = parsed.hostname;
  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(hostname)) {
      return { valid: false, error: "Private or internal hostnames are prohibited for validator accessibility" };
    }
  }

  return { valid: true };
}

export function isValidHttpsUrl(urlStr: string): boolean {
  if (!urlStr || typeof urlStr !== "string") return false;
  const res = validateEvidenceUrl(urlStr);
  if (!res.valid) return false;
  try {
    const parsed = new URL(urlStr.trim());
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function sanitizePromptText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function parseGenToWei(genStr: string | number): bigint {
  if (!genStr) return 0n;
  try {
    const val = typeof genStr === "number" ? genStr.toString() : genStr.trim();
    if (!val || isNaN(Number(val))) return 0n;
    const parts = val.split(".");
    const whole = parts[0] || "0";
    const fraction = (parts[1] || "").slice(0, 18).padEnd(18, "0");
    return BigInt(whole) * 10n ** 18n + BigInt(fraction);
  } catch {
    return 0n;
  }
}

export function formatWei(wei: bigint | string | number | undefined | null, decimals: number = 4): string {
  if (wei === undefined || wei === null) return "0.00";
  try {
    const b = BigInt(wei.toString());
    const ether = Number(b) / 1e18;
    if (ether === 0) return "0";
    if (ether < 0.0001) return "<0.0001";
    return ether.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: decimals,
    });
  } catch {
    return "0.00";
  }
}

export function calculateBpsSettlement(
  claimedAmountInput: bigint | string | number,
  settlementBpsInput: number,
  claimantStakeInput: bigint | string | number,
  underwriterDepositInput: bigint | string | number,
  canonicalVerdict: string = ""
): BpsSettlementCalculation {
  const claimedAmount = BigInt(claimedAmountInput.toString());
  const claimantStake = BigInt(claimantStakeInput.toString());
  const underwriterDeposit = BigInt(underwriterDepositInput.toString());

  const clampedBps = Math.min(Math.max(settlementBpsInput, 0), 10_000);
  const indemnityShare = (claimedAmount * BigInt(clampedBps)) / 10_000n;
  const insurerRetained = claimedAmount - indemnityShare;

  if (canonicalVerdict === "FRAUD_SLASHED" || (clampedBps === 0 && canonicalVerdict === "FRAUD_SLASHED")) {
    return {
      claimedAmount,
      settlementBps: 0,
      indemnityShare: 0n,
      insurerRetained: claimedAmount,
      claimantStake,
      underwriterDeposit,
      claimantTotalPayout: 0n,
      underwriterRefund: underwriterDeposit,
      poolRemainingDelta: claimedAmount + claimantStake,
      grossPayout: "0.00",
      claimantRefundedStake: "0.00",
      netClaimantReceived: "0.00",
    };
  }

  if (clampedBps === 10_000) {
    const totalPayout = claimedAmount + claimantStake + underwriterDeposit;
    return {
      claimedAmount,
      settlementBps: 10_000,
      indemnityShare: claimedAmount,
      insurerRetained: 0n,
      claimantStake,
      underwriterDeposit,
      claimantTotalPayout: totalPayout,
      underwriterRefund: 0n,
      poolRemainingDelta: 0n,
      grossPayout: formatWei(claimedAmount),
      claimantRefundedStake: formatWei(claimantStake),
      netClaimantReceived: formatWei(totalPayout),
    };
  }

  // Partial settlement (1 to 9999 BPS) or Legitimate Exclusion (0 BPS honest denial)
  const totalPayout = indemnityShare + claimantStake;
  return {
    claimedAmount,
    settlementBps: clampedBps,
    indemnityShare,
    insurerRetained,
    claimantStake,
    underwriterDeposit,
    claimantTotalPayout: totalPayout,
    underwriterRefund: underwriterDeposit,
    poolRemainingDelta: insurerRetained,
    grossPayout: formatWei(indemnityShare),
    claimantRefundedStake: formatWei(claimantStake),
    netClaimantReceived: formatWei(totalPayout),
  };
}

export function formatWeiAmount(wei: bigint | string | number | undefined | null): string {
  if (wei === undefined || wei === null) return "0 ETH";
  try {
    const b = BigInt(wei.toString());
    const ether = Number(b) / 1e18;
    if (ether === 0) return "0 ETH";
    if (ether >= 1) {
      return `${ether.toLocaleString("en-US", { maximumFractionDigits: 4 })} ETH`;
    }
    const num = Number(b);
    if (num < 1000000000) {
      return `${num.toLocaleString("en-US")} ETH`;
    }
    return `${ether.toLocaleString("en-US", { maximumFractionDigits: 4 })} ETH`;
  } catch {
    return "0 ETH";
  }
}

export function formatAddress(address: string, chars: number = 4): string {
  if (!address || address.length < 10) return address || "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatBps(bps: number): string {
  const clamped = Math.min(Math.max(bps, 0), 10_000);
  const percentage = (clamped / 100).toFixed(2);
  return `${percentage}% (${clamped} BPS)`;
}

export function formatTimestamp(ts: number): string {
  if (!ts) return "N/A";
  const date = new Date(ts * 1000);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}
