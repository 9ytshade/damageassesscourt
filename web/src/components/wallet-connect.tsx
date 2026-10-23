"use client";

import React, { useState, useRef, useEffect } from "react";
import { useWallet } from "@/lib/use-wallet";
import { WalletIcon } from "@/components/icons";

export function WalletConnect() {
  const {
    account,
    balance,
    isConnected,
    isConnecting,
    isRefreshing,
    wrongNetwork,
    connect,
    disconnect,
    switchAccount,
    switchNetwork,
    formatAddress,
  } = useWallet();

  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleCopy = () => {
    if (!account) return;
    navigator.clipboard.writeText(account);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSwitchAccount = async () => {
    await switchAccount();
    setIsOpen(false);
  };

  const handleDisconnect = async () => {
    await disconnect();
    setIsOpen(false);
  };

  if (isRefreshing) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-[#2d2f38] bg-[#141519] px-4 py-2 text-xs font-mono text-[#d8dbe4]">
        <span className="h-2 w-2 rounded-full bg-[#f0f2f5] animate-ping" />
        <span>REFRESHING...</span>
      </div>
    );
  }

  if (wrongNetwork) {
    return (
      <button
        onClick={switchNetwork}
        className="inline-flex items-center gap-2 rounded-full border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition-all shadow-sm shadow-rose-500/20"
      >
        <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
        <span>SWITCH TO STUDIONET</span>
      </button>
    );
  }

  if (!isConnected) {
    return (
      <button
        onClick={connect}
        disabled={isConnecting}
        className="inline-flex items-center gap-2 rounded-full border border-[#2d2f38] bg-[#16171b] hover:bg-[#202127] hover:border-[#3e424f] px-4 py-2 text-sm font-semibold text-white transition-all shadow-sm disabled:opacity-50"
      >
        <WalletIcon className="h-4 w-4 text-[#9ea3b2]" />
        <span>{isConnecting ? "CONNECTING..." : "CONNECT WALLET"}</span>
      </button>
    );
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Pill Trigger */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-2.5 rounded-full border border-[#282a32] bg-[#121317] px-4 py-2 text-sm font-mono text-[#d8dbe4] hover:border-[#3b3e4a] hover:bg-[#1a1c22] transition-all shadow-sm"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
        <span className="font-semibold text-white tracking-tight">{formatAddress(account)}</span>
        <span className="h-3.5 w-px bg-[#282a32]" />
        <span className="text-[#9ea3b2]">{balance ? `${balance} GEN` : "0 GEN"}</span>
        <span className="text-xs text-[#9ea3b2] ml-0.5" aria-hidden="true">
          ⌄
        </span>
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-[#24262f] bg-[#0d0e11] p-4 shadow-2xl z-50 animate-fade-in text-left">
          {/* Header Row */}
          <div className="flex items-center justify-between border-b border-[#24262f] pb-2.5 mb-3 text-xs font-mono tracking-wider">
            <span className="text-[#9ea3b2] uppercase font-semibold">CONNECTED ACCOUNT</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Studionet
            </span>
          </div>

          {/* Full Address Monospace Container */}
          <div className="rounded-lg bg-[#15161b] p-3 border border-[#24262f] text-xs font-mono text-[#d8dbe4] break-all select-all">
            {account}
          </div>

          {/* Balance Row */}
          <div className="mt-3 flex items-center justify-between text-sm px-1">
            <span className="text-[#9ea3b2]">Balance</span>
            <span className="font-mono font-bold text-white">
              {balance ? `${balance} GEN` : "0 GEN"}
            </span>
          </div>

          {/* Action List */}
          <div className="mt-4 space-y-1.5 pt-3 border-t border-[#24262f]">
            {/* Copy Address */}
            <button
              onClick={handleCopy}
              className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm text-[#d8dbe4] hover:bg-[#1a1c22] hover:text-white transition-colors"
            >
              <span>{copied ? "Address Copied!" : "Copy Address"}</span>
              <span className="text-xs text-[#9ea3b2] font-mono">
                {copied ? "✓" : "CLIPBOARD"}
              </span>
            </button>

            {/* Switch Account */}
            <button
              onClick={handleSwitchAccount}
              className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm text-[#d8dbe4] hover:bg-[#1a1c22] hover:text-white transition-colors"
            >
              <span>Switch / Change Account</span>
              <span className="text-xs text-[#9ea3b2] font-mono">PICKER &rarr;</span>
            </button>

            {/* Disconnect Wallet */}
            <button
              onClick={handleDisconnect}
              className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
            >
              <span>Disconnect Wallet</span>
              <span className="text-xs text-rose-400 font-mono">LOGOUT</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Keep export for backwards compatibility
export { WalletConnect as WalletConnectModal };
