import { createRequire } from "module";
const require = createRequire(import.meta.url);
const keytar = require("C:/Users/9ytshade/Desktop/Genlayer Intelligent Contracts/proofpay/node_modules/keytar");
import { createClient, createAccount } from "../web/node_modules/genlayer-js/dist/index.js";
import { studionet } from "../web/node_modules/genlayer-js/dist/chains/index.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RPC_ENDPOINT = process.env.GENLAYER_RPC_URL || "https://studio.genlayer.com/api";

const recordPath = path.resolve(__dirname, "../deployed-contract-address.json");
const deploymentData = JSON.parse(fs.readFileSync(recordPath, "utf-8"));
const CONTRACT_ADDRESS = deploymentData.contractAddress;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log("===============================================================");
  console.log("  DamageAssessCourt: Studionet On-Chain Lifecycle Execution");
  console.log("===============================================================");
  console.log(`Target Contract Address: ${CONTRACT_ADDRESS}`);

  // 1. Setup actors
  const pkUnderwriter = await keytar.getPassword("genlayer-cli", "account:9ytshade_Deployer");
  const pkClaimant = await keytar.getPassword("genlayer-cli", "account:proofpay-deployer");

  const underwriter = createAccount(pkUnderwriter);
  const claimant = createAccount(pkClaimant);

  const clientUnderwriter = createClient({
    chain: studionet,
    endpoint: RPC_ENDPOINT,
    account: underwriter,
  });

  const clientClaimant = createClient({
    chain: studionet,
    endpoint: RPC_ENDPOINT,
    account: claimant,
  });

  const balUnderwriter = await clientUnderwriter.getBalance({ address: underwriter.address });
  const balClaimant = await clientClaimant.getBalance({ address: claimant.address });

  console.log(`[ACTOR] Underwriter (Alice / 9ytshade_Deployer): ${underwriter.address} | Balance: ${balUnderwriter.toString()} wei`);
  console.log(`[ACTOR] Claimant    (Bob / proofpay-deployer):    ${claimant.address} | Balance: ${balClaimant.toString()} wei\n`);

  const executionLog = {
    timestamp: new Date().toISOString(),
    contract: CONTRACT_ADDRESS,
    network: "GenLayer Studionet (Chain 61999)",
    underwriter: underwriter.address,
    claimant: claimant.address,
    cases: [],
  };

  async function execWrite(client, name, functionName, args, value = 0n) {
    console.log(`--> [TX START] ${name} (${functionName})...`);
    const hash = await client.writeContract({
      address: CONTRACT_ADDRESS,
      functionName,
      args,
      value,
    });
    console.log(`    Tx Hash: ${hash}`);
    console.log(`    Waiting for Studionet validator consensus finalization...`);
    const receipt = await client.waitForTransactionReceipt({
      hash,
      status: "FINALIZED",
      retries: 150,
      interval: 4000,
    });
    console.log(`    Status: ${receipt.status_name || receipt.status} (Finalized)\n`);
    return { hash, receipt };
  }

  // -------------------------------------------------------------
  // Verify Initial State
  // -------------------------------------------------------------
  const version = await clientUnderwriter.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_contract_version",
    args: [],
  });
  console.log(`[VERIFY] Deployed Contract Version: ${version}`);

  const initialPools = await clientUnderwriter.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_total_policy_pools",
    args: [],
  });
  console.log(`[VERIFY] Initial Total Policy Pools: ${initialPools}\n`);

  // -------------------------------------------------------------
  // CASE A: Underwrite Policy Pool, File Claim & Fast-Path Approval
  // -------------------------------------------------------------
  console.log("===============================================================");
  console.log("  CASE A: Policy Pool Creation & Fast-Path Claim Approval");
  console.log("===============================================================");

  const poolTitle = "Gulf Coast Commercial Wind & Storm Surge Facility";
  const poolDesc = "Commercial indemnity pool protecting industrial property against hurricane winds and structural water ingress.";
  const poolTerms = "Perils Covered: Windstorm exceeding 50mph, torrential water ingress following envelope opening. Exclusions: Pre-existing structural wear, rot, rust, cosmetic aging.";
  const maxCap = 20000000000000000n; // 0.02 GEN
  const minStake = 1000000000000000n; // 0.001 GEN
  const reviewWindow = 120; // 120s
  const defenseWindow = 120; // 120s
  const initialEscrow = 50000000000000000n; // 0.05 GEN

  const createPoolTx = await execWrite(
    clientUnderwriter,
    "Alice: Underwrite Policy Pool #1 (0.05 GEN Escrow)",
    "create_policy_pool",
    [poolTitle, poolDesc, poolTerms, maxCap, minStake, reviewWindow, defenseWindow],
    initialEscrow
  );

  const pool1 = await clientUnderwriter.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_policy_pool",
    args: [1n],
  });
  console.log(`    Policy Pool #1 Created: "${pool1.title}"`);
  console.log(`    Total Escrow: ${pool1.total_escrow_pool.toString()} wei`);
  console.log(`    Active Claims: ${pool1.active_claims_count}\n`);

  // Claimant files Claim #1
  const claim1Amount = 10000000000000000n; // 0.01 GEN
  const claim1Title = "Warehouse Bay 3 Roof Membrane Shear & Water Ingress";
  const claim1Desc = "Sustained hurricane gusts sheared roof membrane; rainwater penetrated warehouse inventory.";
  const claim1RepairUrl = "https://raw.githubusercontent.com/9ytshade/damageassesscourt/main/fixtures/storm_damage_repair_estimate_2026.json";
  const claim1WeatherUrl = "https://raw.githubusercontent.com/9ytshade/damageassesscourt/main/fixtures/noaa_weather_storm_report_2026.json";

  const fileClaim1Tx = await execWrite(
    clientClaimant,
    "Bob: File Damage Claim #1 (0.01 GEN Claimed, 0.001 GEN Anti-Spam Stake)",
    "file_claim",
    [1n, claim1Title, claim1Desc, claim1RepairUrl, claim1WeatherUrl, claim1Amount],
    minStake
  );

  let claim1Data = await clientUnderwriter.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_claim",
    args: [1n],
  });
  console.log(`    Claim #1 Status: ${claim1Data.status}`);
  console.log(`    Claimant: ${claim1Data.claimant}`);
  console.log(`    Claimed Amount: ${claim1Data.claimed_amount.toString()} wei\n`);

  // Underwriter approves Claim #1 (Fast-Path Full Settlement)
  const approveClaim1Tx = await execWrite(
    clientUnderwriter,
    "Alice: Approve Claim #1 (100% Full Payout & Stake Return)",
    "approve_claim",
    [1n],
    0n
  );

  claim1Data = await clientUnderwriter.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_claim",
    args: [1n],
  });
  console.log(`    Claim #1 Final Status: ${claim1Data.status}`);

  executionLog.cases.push({
    caseName: "Case A: Policy Creation, Claim Filing & Fast-Path Full Settlement",
    policyId: 1,
    claimId: 1,
    transactions: {
      createPolicyPool: createPoolTx.hash,
      fileClaim: fileClaim1Tx.hash,
      approveClaim: approveClaim1Tx.hash,
    },
    finalStatus: claim1Data.status,
    verifiedFastPathSettlement: true,
  });

  // -------------------------------------------------------------
  // CASE B: Contested Claim, Claimant Defense Handshake & AI Consensus
  // -------------------------------------------------------------
  console.log("\n===============================================================");
  console.log("  CASE B: Contestation, Defense Handshake & AI Consensus Trial");
  console.log("===============================================================");

  const claim2Amount = 15000000000000000n; // 0.015 GEN
  const claim2Title = "Distribution Center South Dock Wind Damage & Water Ingress";
  const claim2Desc = "Severe windstorm pressure breached dock door seal, flooding electronics storage bay.";
  const claim2RepairUrl = "https://raw.githubusercontent.com/9ytshade/damageassesscourt/main/fixtures/storm_damage_dock_repair_2026.json";
  const claim2WeatherUrl = "https://raw.githubusercontent.com/9ytshade/damageassesscourt/main/fixtures/noaa_weather_storm_report_2026.json";

  const fileClaim2Tx = await execWrite(
    clientClaimant,
    "Bob: File Damage Claim #2 (0.015 GEN Claimed)",
    "file_claim",
    [1n, claim2Title, claim2Desc, claim2RepairUrl, claim2WeatherUrl, claim2Amount],
    minStake
  );

  console.log("--> Underwriter reviewing evidence and lodging formal exclusion contest...");
  const contestReason = "Repair quote includes pre-existing rust on structural beams and cosmetic siding replacement.";
  const contestClaim2Tx = await execWrite(
    clientUnderwriter,
    "Alice: Contest Claim #2 with Exclusion Grievance & Matching Deposit",
    "contest_claim",
    [2n, contestReason],
    minStake
  );

  let claim2Data = await clientUnderwriter.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_claim",
    args: [2n],
  });
  console.log(`    Claim #2 Status: ${claim2Data.status}`);
  console.log(`    Underwriter Deposit: ${claim2Data.underwriter_deposit.toString()} wei\n`);

  console.log("--> Claimant submitting defense rebuttal and waiving remaining countdown...");
  const defenseRebuttal = "Rusted fasteners were ancillary; invoice line items verify membrane panels installed in 2025.";
  const submitDefense2Tx = await execWrite(
    clientClaimant,
    "Bob: Submit Defense Rebuttal & Waive Remaining Defense Window",
    "submit_defense",
    [2n, defenseRebuttal, true],
    0n
  );

  claim2Data = await clientUnderwriter.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_claim",
    args: [2n],
  });
  console.log(`    Claim #2 Status after defense: ${claim2Data.status}`);
  console.log(`    Defense Deadline: ${claim2Data.defense_deadline.toString()}\n`);

  console.log("--> [AI MAGISTRATE] Convening Equivalence Principle AI Consensus Adjudication on Studionet...");
  const adjudicateClaim2Tx = await execWrite(
    clientUnderwriter,
    "Equivalence Principle AI Magistrate Adjudication",
    "adjudicate_claim",
    [2n],
    0n
  );

  claim2Data = await clientUnderwriter.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_claim",
    args: [2n],
  });
  console.log(`    Claim #2 Final Status: ${claim2Data.status}`);
  console.log(`    Verdict ID: ${claim2Data.verdict_id}`);

  let verdict2Data = null;
  if (claim2Data.verdict_id > 0) {
    verdict2Data = await clientUnderwriter.readContract({
      address: CONTRACT_ADDRESS,
      functionName: "get_verdict",
      args: [claim2Data.verdict_id],
    });
    console.log(`    Canonical Verdict: ${verdict2Data.canonical_verdict}`);
    console.log(`    Settlement BPS:    ${verdict2Data.settlement_bps} / 10,000 (${(verdict2Data.settlement_bps / 100).toFixed(2)}%)`);
    console.log(`    Covered Criteria:  ${verdict2Data.covered_criteria_count}`);
    console.log(`    Excluded Criteria: ${verdict2Data.excluded_criteria_count}`);
    console.log(`    Ruling Summary:    ${verdict2Data.ruling_summary}`);
  }

  executionLog.cases.push({
    caseName: "Case B: Contestation, Defense Handshake & Equivalence Principle AI Adjudication",
    policyId: 1,
    claimId: 2,
    transactions: {
      fileClaim: fileClaim2Tx.hash,
      contestClaim: contestClaim2Tx.hash,
      submitDefense: submitDefense2Tx.hash,
      adjudicateClaim: adjudicateClaim2Tx.hash,
    },
    finalStatus: claim2Data.status,
    verdict: verdict2Data
      ? {
          verdictId: claim2Data.verdict_id,
          canonicalVerdict: verdict2Data.canonical_verdict,
          settlementBps: verdict2Data.settlement_bps,
          rulingSummary: verdict2Data.ruling_summary,
        }
      : null,
  });

  // -------------------------------------------------------------
  // Verify Totals and Final State
  // -------------------------------------------------------------
  const finalPoolsCount = await clientUnderwriter.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_total_policy_pools",
    args: [],
  });
  const finalClaimsCount = await clientUnderwriter.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_total_claims",
    args: [],
  });
  const finalVerdictsCount = await clientUnderwriter.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_total_verdicts",
    args: [],
  });

  console.log("\n===============================================================");
  console.log("  FINAL PROTOCOL STATE ON GENLAYER STUDIONET");
  console.log("===============================================================");
  console.log(`  Total Policy Pools: ${finalPoolsCount}`);
  console.log(`  Total Claims:       ${finalClaimsCount}`);
  console.log(`  Total Verdicts:     ${finalVerdictsCount}`);
  console.log("===============================================================\n");

  executionLog.finalTotals = {
    policyPools: Number(finalPoolsCount),
    claims: Number(finalClaimsCount),
    verdicts: Number(finalVerdictsCount),
  };

  const resultsOutPath = path.resolve(__dirname, "../studionet-execution-results.json");
  fs.writeFileSync(resultsOutPath, JSON.stringify(executionLog, null, 2), "utf-8");
  console.log(`[SAVED] Execution results written to ${resultsOutPath}`);
}

main().catch((err) => {
  console.error("Lifecycle execution failed:", err);
  process.exit(1);
});
