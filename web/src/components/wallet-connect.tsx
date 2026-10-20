"use client";

import React, { useState } from "react";
import { useWallet } from "@/lib/use-wallet";
import { STUDIONET_CHAIN_ID, STUDIONET_RPC } from "@/lib/genlayer";
import { WalletIcon, ExternalLinkIcon, CheckCircleIcon, XCircleIcon } from "@/components/icons";

export function WalletConnectModal({ onClose }: { onClose: () => void }) {
  const { account, balance, isConnected, isConnecting, wrongNetwork, connect, disconnect, switchNetwork, formatAddress } =
    useWallet();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!account) return;
    navigator.clipboard.writeText(account);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnect = async () => {
    const ok = await connect();
    if (ok) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white text-lg font-bold"
        >
          &times;
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <WalletIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Wallet Connection</h3>
            <p className="text-xs text-slate-400">Connect to GenLayer Studionet</p>
          </div>
        </div>

        {wrongNetwork && (
          <div className="mb-4 rounded-lg bg-rose-500/10 border border-rose-500/30 p-3.5 text-xs text-rose-300 flex items-start gap-3">
            <XCircleIcon className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
            <div>
              <p className="font-semibold">Incorrect Network Detected</p>
              <p className="mt-1 text-slate-300">
                DamageAssessCourt operates on GenLayer Studionet (Chain ID {STUDIONET_CHAIN_ID}).
              </p>
              <button
                onClick={switchNetwork}
                className="mt-2.5 rounded bg-rose-500/20 px-3 py-1 font-semibold text-rose-200 border border-rose-500/40 hover:bg-rose-500/30 transition-colors"
              >
                Switch to Studionet
              </button>
            </div>
          </div>
        )}

        {isConnected ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-slate-950/70 p-4 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Connected Account</span>
                <button
                  onClick={handleCopy}
                  className="text-amber-400 hover:text-amber-300 text-[11px] font-medium"
                >
                  {copied ? "Copied!" : "Copy Address"}
                </button>
              </div>
              <p className="text-sm font-mono font-medium text-slate-200 break-all">{account}</p>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">Balance:</span>
                <span className="font-semibold text-white">{balance ? `${balance} GEN` : "Loading..."}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>Network</span>
              <span className="text-slate-200 font-mono">
                {wrongNetwork ? "Wrong Chain" : `Studionet (${STUDIONET_CHAIN_ID})`}
              </span>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                onClick={disconnect}
                className="flex-1 rounded-lg border border-slate-700 bg-slate-800 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
              >
                Disconnect
              </button>
              <button
                onClick={onClose}
                className="flex-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 py-2 text-xs font-semibold text-slate-950 hover:from-amber-400 hover:to-amber-500 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-slate-300">
              Connect your MetaMask or Ethereum browser wallet to file damage claims, underwrite risk pools, or
              participate in AI court dispute adjudications.
            </p>

            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 py-2.5 text-xs font-semibold text-slate-950 hover:from-amber-400 hover:to-amber-500 transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
            >
              <WalletIcon className="h-4 w-4" />
              {isConnecting ? "Connecting to Wallet..." : "Connect Browser Wallet"}
            </button>

            <div className="rounded-lg bg-slate-950/50 p-3 border border-slate-800/80 text-[11px] text-slate-400 space-y-1.5">
              <p className="font-semibold text-slate-300">Network Details:</p>
              <p>RPC Endpoint: <span className="font-mono text-slate-300">{STUDIONET_RPC}</span></p>
              <p>Chain ID: <span className="font-mono text-slate-300">{STUDIONET_CHAIN_ID}</span></p>
              <div className="pt-1">
                <a
                  href="https://studio.genlayer.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-amber-400 hover:underline"
                >
                  GenLayer Studio Faucet <ExternalLinkIcon className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
