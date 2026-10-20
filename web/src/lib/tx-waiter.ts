"use client";

export interface FinalizedTransactionReceipt {
  hash: string;
  status: "FINALIZED" | "ACCEPTED" | "ERROR";
  executionStatus: "SUCCESS" | "REVERTED";
  resultCode?: number;
  blockNumber?: number;
  error?: string;
  raw?: Record<string, unknown>;
}

const PENDING_STORAGE_KEY = "damageassesscourt-pending-txs";

interface StoredPendingTx {
  hash: string;
  action: string;
  submittedAt: number;
}

export function savePendingTx(hash: string, action: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(PENDING_STORAGE_KEY);
    const list: StoredPendingTx[] = raw ? JSON.parse(raw) : [];
    if (!list.some((item) => item.hash.toLowerCase() === hash.toLowerCase())) {
      list.push({ hash, action, submittedAt: Date.now() });
      window.localStorage.setItem(PENDING_STORAGE_KEY, JSON.stringify(list));
    }
  } catch (err) {
    console.warn("Failed saving pending transaction to localStorage:", err);
  }
}

export function removePendingTx(hash: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(PENDING_STORAGE_KEY);
    if (!raw) return;
    const list: StoredPendingTx[] = JSON.parse(raw);
    const filtered = list.filter((item) => item.hash.toLowerCase() !== hash.toLowerCase());
    window.localStorage.setItem(PENDING_STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.warn("Failed removing pending transaction from localStorage:", err);
  }
}

export function getPendingTxs(): StoredPendingTx[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PENDING_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function pollTransactionUntilFinalized(
  txHash: string,
  onStatusUpdate?: (status: string) => void,
  maxAttempts: number = 60,
  intervalMs: number = 3000
): Promise<FinalizedTransactionReceipt> {
  const rpcUrl = process.env.NEXT_PUBLIC_GENLAYER_RPC_URL || "https://studio.genlayer.com/api";

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_getTransactionReceipt",
          params: [txHash],
          id: attempt,
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const receipt = json.result;

        if (receipt) {
          const status = receipt.status || receipt.consensus_status;
          if (status === "FINALIZED" || status === "0x1" || status === 1) {
            removePendingTx(txHash);
            return {
              hash: txHash,
              status: "FINALIZED",
              executionStatus: receipt.status === "0x0" ? "REVERTED" : "SUCCESS",
              blockNumber: receipt.blockNumber ? parseInt(receipt.blockNumber, 16) : undefined,
              raw: receipt,
            };
          }
          if (onStatusUpdate) {
            onStatusUpdate(`Consensus verification in progress (attempt ${attempt}/${maxAttempts})...`);
          }
        }
      }
    } catch (err) {
      console.warn(`Receipt polling attempt ${attempt} failed:`, err);
    }

    await new Promise((res) => setTimeout(res, intervalMs));
  }

  throw new Error(`Transaction ${txHash} did not reach confirmed finality within ${maxAttempts * (intervalMs / 1000)} seconds.`);
}
