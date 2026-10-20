import { describe, it, expect } from "vitest";
import {
  isValidHttpsUrl,
  calculateBpsSettlement,
  formatWeiAmount,
  formatAddress,
} from "./safety";

describe("safety.ts - URL Validation & SSRF Prevention", () => {
  it("accepts valid public https URLs", () => {
    expect(isValidHttpsUrl("https://example.com/invoice.json")).toBe(true);
    expect(isValidHttpsUrl("https://contractor.repair.org/quote/1234")).toBe(true);
    expect(isValidHttpsUrl("https://noaa.weather.example.gov/reports/storm2026.json")).toBe(true);
  });

  it("rejects non-https schemes (http, ftp, file, ws)", () => {
    expect(isValidHttpsUrl("http://example.com/data.json")).toBe(false);
    expect(isValidHttpsUrl("ftp://example.com/data.json")).toBe(false);
    expect(isValidHttpsUrl("file:///etc/passwd")).toBe(false);
    expect(isValidHttpsUrl("javascript:alert(1)")).toBe(false);
  });

  it("rejects localhost and loopback addresses", () => {
    expect(isValidHttpsUrl("https://localhost/test")).toBe(false);
    expect(isValidHttpsUrl("https://127.0.0.1/test")).toBe(false);
    expect(isValidHttpsUrl("https://0.0.0.0/test")).toBe(false);
  });

  it("rejects private IPv4 networks (SSRF prevention)", () => {
    expect(isValidHttpsUrl("https://10.0.0.1/admin")).toBe(false);
    expect(isValidHttpsUrl("https://172.16.0.5/api")).toBe(false);
    expect(isValidHttpsUrl("https://192.168.1.1/secret")).toBe(false);
  });

  it("rejects URLs with embedded user credentials", () => {
    expect(isValidHttpsUrl("https://admin:password@example.com/data.json")).toBe(false);
  });

  it("rejects malformed and empty URLs", () => {
    expect(isValidHttpsUrl("")).toBe(false);
    expect(isValidHttpsUrl("not a url")).toBe(false);
    expect(isValidHttpsUrl("https://")).toBe(false);
  });
});

describe("safety.ts - Basis Points (BPS) Settlement Math", () => {
  const CLAIMED = 50_000n;
  const STAKE = 1_000n;
  const DEPOSIT = 1_000n;

  it("calculates 10,000 BPS (100% Full Indemnity) correctly", () => {
    const res = calculateBpsSettlement(CLAIMED, 10_000, STAKE, DEPOSIT);

    expect(res.settlementBps).toBe(10_000);
    expect(res.indemnityShare).toBe(50_000n);
    expect(res.insurerRetained).toBe(0n);
    // Full indemnity: claimant gets indemnity + stake + underwriter dispute deposit
    expect(res.claimantTotalPayout).toBe(50_000n + 1_000n + 1_000n);
    expect(res.underwriterRefund).toBe(0n);
    // Invariant holds
    expect(res.indemnityShare + res.insurerRetained).toBe(res.claimedAmount);
  });

  it("calculates 6,850 BPS (68.5% Partial Settlement) correctly", () => {
    const res = calculateBpsSettlement(CLAIMED, 6_850, STAKE, DEPOSIT);

    expect(res.settlementBps).toBe(6_850);
    // 50,000 * 6850 / 10000 = 34,250
    expect(res.indemnityShare).toBe(34_250n);
    expect(res.insurerRetained).toBe(15_750n);
    // Claimant gets indemnity + stake returned
    expect(res.claimantTotalPayout).toBe(34_250n + 1_000n);
    // Underwriter gets deposit returned
    expect(res.underwriterRefund).toBe(1_000n);
    // Strict Value Conservation Invariant
    expect(res.indemnityShare + res.insurerRetained).toBe(res.claimedAmount);
  });

  it("calculates 0 BPS (0% Denial / Legit Exclusion) correctly", () => {
    const res = calculateBpsSettlement(CLAIMED, 0, STAKE, DEPOSIT);

    expect(res.settlementBps).toBe(0);
    expect(res.indemnityShare).toBe(0n);
    expect(res.insurerRetained).toBe(50_000n);
    // Claimant gets stake returned (honest exclusion safeguard)
    expect(res.claimantTotalPayout).toBe(1_000n);
    // Underwriter gets deposit returned
    expect(res.underwriterRefund).toBe(1_000n);
    // Invariant holds
    expect(res.indemnityShare + res.insurerRetained).toBe(res.claimedAmount);
  });

  it("clamps out-of-range BPS values safely between 0 and 10,000", () => {
    const belowZero = calculateBpsSettlement(CLAIMED, -500, STAKE, DEPOSIT);
    expect(belowZero.settlementBps).toBe(0);
    expect(belowZero.indemnityShare).toBe(0n);

    const aboveTenThousand = calculateBpsSettlement(CLAIMED, 15_000, STAKE, DEPOSIT);
    expect(aboveTenThousand.settlementBps).toBe(10_000);
    expect(aboveTenThousand.indemnityShare).toBe(50_000n);
  });
});

describe("safety.ts - Formatting Utilities", () => {
  it("formats wei and token amounts cleanly", () => {
    expect(formatWeiAmount(0)).toBe("0 ETH");
    expect(formatWeiAmount(1000)).toBe("1,000 ETH");
    expect(formatWeiAmount("50000")).toBe("50,000 ETH");
  });

  it("formats addresses cleanly with prefix and suffix", () => {
    const addr = "0xB704b624ae5f776b3a3fA7496aDcdA4dB4DCAB56";
    expect(formatAddress(addr)).toBe("0xB704...AB56");
    expect(formatAddress("0x1234")).toBe("0x1234");
  });
});
