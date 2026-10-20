import type { Metadata } from "next";
import Link from "next/link";
import { STUDIONET_CHAIN_ID, DAMAGE_ASSESS_COURT_ADDRESS } from "@/lib/genlayer";

export const metadata: Metadata = {
  title: "Privacy & Public Ledger | DamageAssessCourt",
  description: "Public transparency, on-chain ledger records, and privacy practices of DamageAssessCourt.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-[1536px] w-full px-5 sm:px-8 lg:px-12 py-10 sm:py-14 text-left animate-fade-in">
      <div className="mb-10 border-b border-[#22242c] pb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 font-mono text-xs text-[#9ea3b2] hover:text-white transition-colors"
        >
          &larr; Back to Dashboard
        </Link>
        <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white font-mono">
          Privacy &amp; Public Ledger Policy
        </h1>
        <p className="mt-3 text-sm font-mono text-[#9ea3b2]">
          Last Updated: October 20, 2026 &middot; Protocol Version 1.0.0 &middot; Studionet ({STUDIONET_CHAIN_ID})
        </p>
      </div>

      <div className="space-y-6 text-base leading-relaxed text-[#d8dbe4]">
        <section className="rounded-2xl border border-[#22242c] bg-[#141519]/70 p-6 sm:p-8 space-y-4">
          <h2 className="text-xl font-bold text-white font-mono">
            1. Public Blockchain Records
          </h2>
          <p className="text-[#9ea3b2] leading-relaxed">
            DamageAssessCourt operates directly on the GenLayer public distributed ledger. When you underwrite a pool, submit a damage claim, file a contest brief, or trigger consensus adjudication, the following data points become permanently visible to any network participant:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-sm text-[#9ea3b2]">
            <li>Your public wallet address (e.g. <code className="text-white bg-[#1a1b22] px-2 py-0.5 rounded border border-[#2d2f38]">0x...</code>).</li>
            <li>Policy terms, peril clauses, escrow deposits, and max payout limits.</li>
            <li>Damage descriptions, claimed amounts, and attached public evidence URLs (photographs, radar feeds, police dispatch links).</li>
            <li>Validator consensus votes, calculated Basis Points, and settlement transaction hashes.</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-[#22242c] bg-[#141519]/70 p-6 sm:p-8 space-y-4">
          <h2 className="text-xl font-bold text-white font-mono">
            2. Evidence URL Submissions
          </h2>
          <p className="text-[#9ea3b2] leading-relaxed">
            Users submitting claims should only provide public HTTP or IPFS URLs for property damage photographs and weather records. Do not submit personally identifiable information (PII) such as personal phone numbers, government identification documents, or medical records.
          </p>
        </section>

        <section className="rounded-2xl border border-[#22242c] bg-[#141519]/70 p-6 sm:p-8 space-y-4">
          <h2 className="text-xl font-bold text-white font-mono">
            3. Local Web Storage
          </h2>
          <p className="text-[#9ea3b2] leading-relaxed">
            The web client utilizes browser <code className="text-white bg-[#1a1b22] px-2 py-0.5 rounded border border-[#2d2f38]">sessionStorage</code> and <code className="text-white bg-[#1a1b22] px-2 py-0.5 rounded border border-[#2d2f38]">localStorage</code> strictly to persist non-sensitive user interface preferences, such as disconnected wallet flags to prevent unwanted auto-reconnections. No telemetry, tracker cookies, or third-party advertising scripts are loaded.
          </p>
        </section>
      </div>
    </main>
  );
}
