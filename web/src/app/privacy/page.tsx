import type { Metadata } from "next";
import Link from "next/link";
import { STUDIONET_CHAIN_ID } from "@/lib/genlayer";

export const metadata: Metadata = {
  title: "Privacy & Public Ledger | DamageAssessCourt",
  description: "Public transparency, on-chain ledger records, and privacy practices of DamageAssessCourt.",
};

export default function PrivacyPage() {
  return (
    <div className="w-full pb-20 space-y-10 animate-fade-in text-left">
      {/* Full-Width Top Header Banner matching Landing Page */}
      <section className="relative w-full border-b border-[#22242c] bg-[#000000] py-12 lg:py-16">
        <div className="mx-auto max-w-[1536px] w-full px-5 sm:px-8 lg:px-12 space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-mono text-xs text-[#9ea3b2] hover:text-white transition-colors"
          >
            &larr; Back to Dashboard
          </Link>
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white font-mono">
              Privacy &amp; Public Ledger Policy
            </h1>
            <p className="text-sm font-mono text-[#9ea3b2]">
              Last Updated: October 20, 2026 &middot; Protocol Version 1.0.0 &middot; Studionet ({STUDIONET_CHAIN_ID})
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="mx-auto max-w-[1536px] w-full px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-base leading-relaxed text-[#d8dbe4]">
          <section className="rounded-3xl border border-[#22242c] bg-[#141519]/70 p-6 sm:p-8 space-y-4">
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

          <section className="rounded-3xl border border-[#22242c] bg-[#141519]/70 p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold text-white font-mono">
              2. Evidence URL Submissions
            </h2>
            <p className="text-[#9ea3b2] leading-relaxed">
              Users submitting claims should only provide public HTTP or IPFS URLs for property damage photographs and weather records. Do not submit personally identifiable information (PII) such as personal phone numbers, government identification documents, or medical records.
            </p>
            <p className="text-sm text-[#9ea3b2] leading-relaxed">
              All submitted evidence links are ingested by validator sandboxes strictly as read-only telemetry.
            </p>
          </section>

          <section className="rounded-3xl border border-[#22242c] bg-[#141519]/70 p-6 sm:p-8 space-y-4 md:col-span-2">
            <h2 className="text-xl font-bold text-white font-mono">
              3. Local Web Storage &amp; Cookies
            </h2>
            <p className="text-[#9ea3b2] leading-relaxed">
              The web client utilizes browser <code className="text-white bg-[#1a1b22] px-2 py-0.5 rounded border border-[#2d2f38]">sessionStorage</code> and <code className="text-white bg-[#1a1b22] px-2 py-0.5 rounded border border-[#2d2f38]">localStorage</code> strictly to persist non-sensitive user interface preferences, such as disconnected wallet flags to prevent unwanted auto-reconnections. No telemetry, tracker cookies, or third-party advertising scripts are loaded.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
