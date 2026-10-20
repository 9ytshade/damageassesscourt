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

async function main() {
  console.log("===============================================================");
  console.log("  DamageAssessCourt: Studionet Deployment");
  console.log("===============================================================");

  // 1. Retrieve 9ytshade_Deployer private key from system keychain
  const deployerPk = await keytar.getPassword("genlayer-cli", "account:9ytshade_Deployer");
  if (!deployerPk) {
    throw new Error("Deployer (9ytshade_Deployer) private key not found in keytar");
  }
  const deployer = createAccount(deployerPk);
  console.log(`[ACCOUNT] Deployer: ${deployer.address}`);

  const client = createClient({
    chain: studionet,
    endpoint: RPC_ENDPOINT,
    account: deployer,
  });

  const balance = await client.getBalance({ address: deployer.address });
  console.log(`[BALANCE] Deployer Balance: ${balance.toString()} wei (${Number(balance) / 1e18} GEN)\n`);

  // 2. Read Intelligent Contract code
  const contractPath = path.resolve(__dirname, "../contracts/damageassesscourt.py");
  const contractCode = fs.readFileSync(contractPath, "utf-8");
  console.log(`[CONTRACT] Read contract code (${contractCode.length} bytes) from ${contractPath}`);

  // 3. Deploy Intelligent Contract
  console.log("--> [TX START] Broadcasting deployContract to GenLayer Studionet (Chain 61999)...");
  const txHash = await client.deployContract({
    code: contractCode,
    args: [],
  });

  console.log(`    Deployment Tx Hash: ${txHash}`);
  console.log("    Waiting for Studionet validator consensus finalization (retries: 150, interval: 5000ms)...");

  const receipt = await client.waitForTransactionReceipt({
    hash: txHash,
    status: "FINALIZED",
    retries: 150,
    interval: 5000,
  });

  console.log(`    Receipt Status: ${receipt.status}`);

  const contractAddress =
    receipt.contractAddress ||
    receipt.data?.contract_address ||
    receipt.data?.address ||
    (typeof receipt.data === "string" ? receipt.data : null);

  if (!contractAddress) {
    console.error("Full receipt:", JSON.stringify(receipt, null, 2));
    throw new Error("Deployment receipt did not contain a contract address");
  }

  console.log("\n===============================================================");
  console.log(`  DEPLOYED CONTRACT ADDRESS: ${contractAddress}`);
  console.log(`  DEPLOYMENT TX HASH:        ${txHash}`);
  console.log(`  DEPLOYER ACCOUNT:          ${deployer.address}`);
  console.log("===============================================================\n");

  // 4. Verify deployment via readContract
  try {
    const version = await client.readContract({
      address: contractAddress,
      functionName: "get_contract_version",
      args: [],
    });
    console.log(`[VERIFICATION] Contract version readback: ${version}`);

    const totalPools = await client.readContract({
      address: contractAddress,
      functionName: "get_total_policy_pools",
      args: [],
    });
    console.log(`[VERIFICATION] Total policy pools readback: ${totalPools}`);
  } catch (readErr) {
    console.warn("[WARNING] Read contract verification note:", readErr.message);
  }

  // 5. Update web/.env.local and save record
  const envLocalPath = path.resolve(__dirname, "../web/.env.local");
  const envContent = `NEXT_PUBLIC_GENLAYER_RPC_URL=https://studio.genlayer.com/api\nNEXT_PUBLIC_GENLAYER_CHAIN_ID=61999\nNEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}\n`;
  fs.writeFileSync(envLocalPath, envContent, "utf-8");
  console.log(`[ENV] Updated ${envLocalPath}`);

  const deploymentRecord = {
    contractAddress,
    deployer: deployer.address,
    transactionHash: txHash,
    network: "GenLayer Studionet",
    chainId: 61999,
    timestamp: new Date().toISOString(),
  };

  const recordPath = path.resolve(__dirname, "../deployed-contract-address.json");
  fs.writeFileSync(recordPath, JSON.stringify(deploymentRecord, null, 2), "utf-8");
  console.log(`[RECORD] Saved deployment record to ${recordPath}`);
}

main().catch((err) => {
  console.error("Deployment failed:", err);
  process.exit(1);
});
