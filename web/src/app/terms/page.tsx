import type { Metadata } from "next";
import Link from "next/link";
import { STUDIONET_CHAIN_ID, DAMAGE_ASSESS_COURT_ADDRESS } from "@/lib/genlayer";

export const metadata: Metadata = {
  title: "Terms of Use | DamageAssessCourt",
  description: "Terms governing policy pool underwriting, damage claims filing, AI consensus adjudication, and finality on DamageAssessCourt.",
};

export default function TermsPage() {
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
          Terms of Use
        </h1>
        <p className="mt-2 text-xs font-mono text-[#8a8f98]">
          Last Updated: October 20, 2026 &middot; Protocol Version 1.0.0 &middot; Studionet ({STUDIONET_CHAIN_ID})
        </p>
      </div>

      <div className="space-y-6 text-sm leading-relaxed text-[#d0d6e0]">
        <section className="linear-card p-6 space-y-3">
          <h2 className="text-base font-bold text-white font-mono">
            1. Nature of the Protocol
          </h2>
          <p className="text-[#8a8f98]">
            DamageAssessCourt is a decentralized, non-custodial intelligent contract protocol deployed on GenLayer Studionet. Underwritten risk facilities, damage claims, photo-evidence evaluation, and escrow payouts execute autonomously through validator AI consensus.
          </p>
          <ul className="list-disc space-y-1.5 pl-5 text-xs text-[#8a8f98]">
            <li><strong>No Central Custodian:</strong> Escrow capital is locked in the GenLayer Intelligent Contract at <code>{DAMAGE_ASSESS_COURT_ADDRESS}</code>.</li>
            <li><strong>Equivalence Principle Rulings:</strong> Validator nodes cross-examine evidence under consensus. No single centralized entity can alter rulings.</li>
            <li><strong>Continuous Indemnity:</strong> Payouts are computed using continuous Basis Points (0-10,000 bps) math based on policy terms.</li>
          </ul>
        </section>

        <section className="linear-card p-6 space-y-3">
          <h2 className="text-base font-bold text-white font-mono">
            2. Policy Underwriting &amp; Escrow
          </h2>
          <p className="text-[#8a8f98]">
            Underwriters depositing capital into policy pools acknowledge that locked funds are held in smart contract custody to indemnify valid claims under the specified peril criteria. Capital is released only to verified claimants upon consensus or returned to the underwriter if the pool is deactivated with no active pending claims.
          </p>
        </section>

        <section className="linear-card p-6 space-y-3">
          <h2 className="text-base font-bold text-white font-mono">
            3. Claim Submission &amp; Anti-Spam Stakes
          </h2>
          <p className="text-[#8a8f98]">
            Claimants must post a required anti-spam stake in GEN when filing a damage incident. The stake is fully refunded upon legitimate adjudication. If validators determine by consensus that a claim incorporates fabricated evidence or fraudulent misrepresentation, the stake is permanently slashed into the pool capital.
          </p>
        </section>

        <section className="linear-card p-6 space-y-3">
          <h2 className="text-base font-bold text-white font-mono">
            4. Studionet Testnet Disclaimer
          </h2>
          <p className="text-[#8a8f98]">
            DamageAssessCourt is operating on GenLayer Studionet (Chain ID {STUDIONET_CHAIN_ID}). All balances, stakes, rewards, and payouts represent simulated testnet tokens with zero real-world fiat value. No insurance contract formed on Studionet constitutes a legally regulated financial product under municipal insurance regulations.
          </p>
        </section>
      </div>
    </main>
  );
}
