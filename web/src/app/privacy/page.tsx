import type { Metadata } from "next";
import Link from "next/link";
import { STUDIONET_CHAIN_ID, DAMAGE_ASSESS_COURT_ADDRESS } from "@/lib/genlayer";

export const metadata: Metadata = {
  title: "Privacy & Public Ledger | DamageAssessCourt",
  description: "Public transparency, on-chain ledger records, and privacy practices of DamageAssessCourt.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 text-left">
      <div className="mb-8 border-b border-[#23252a] pb-6">
        <Link
          href="/"
          className="font-mono text-xs text-[#8a8f98] hover:text-[#ffb829] transition-colors"
        >
          &larr; Back to Dashboard
        </Link>
        <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-mono">
          Privacy &amp; Public Ledger Policy
        </h1>
        <p className="mt-2 text-xs font-mono text-[#8a8f98]">
          Last Updated: October 20, 2026 &middot; Protocol Version 1.0.0 &middot; Studionet ({STUDIONET_CHAIN_ID})
        </p>
      </div>

      <div className="space-y-6 text-sm leading-relaxed text-[#d0d6e0]">
        <section className="linear-card p-6 space-y-3">
          <h2 className="text-base font-bold text-white font-mono">
            1. Public Blockchain Records
          </h2>
          <p className="text-[#8a8f98]">
            DamageAssessCourt operates directly on the GenLayer public distributed ledger. When you underwrite a pool, submit a damage claim, file a contest brief, or trigger consensus adjudication, the following data points become permanently visible to any network participant:
          </p>
          <ul className="list-disc space-y-1.5 pl-5 text-xs text-[#8a8f98]">
            <li>Your public wallet address (e.g. <code>0x...</code>).</li>
            <li>Policy terms, peril clauses, escrow deposits, and max payout limits.</li>
            <li>Damage descriptions, claimed amounts, and attached public evidence URLs (photographs, radar feeds, police dispatch links).</li>
            <li>Validator consensus votes, calculated Basis Points, and settlement transaction hashes.</li>
          </ul>
        </section>

        <section className="linear-card p-6 space-y-3">
          <h2 className="text-base font-bold text-white font-mono">
            2. Evidence URL Submissions
          </h2>
          <p className="text-[#8a8f98]">
            Users submitting claims should only provide public HTTP or IPFS URLs for property damage photographs and weather records. Do not submit personally identifiable information (PII) such as personal phone numbers, government identification documents, or medical records.
          </p>
        </section>

        <section className="linear-card p-6 space-y-3">
          <h2 className="text-base font-bold text-white font-mono">
            3. Local Web Storage
          </h2>
          <p className="text-[#8a8f98]">
            The web client utilizes browser <code>sessionStorage</code> and <code>localStorage</code> strictly to persist non-sensitive user interface preferences, such as disconnected wallet flags to prevent unwanted auto-reconnections. No telemetry, tracker cookies, or third-party advertising scripts are loaded.
          </p>
        </section>
      </div>
    </main>
  );
}
