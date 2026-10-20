"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { STUDIONET_CHAIN_ID, STUDIONET_RPC } from "./genlayer";
import { formatAddress, formatWei } from "./safety";

const DISCONNECT_KEY = "damageassesscourt-wallet-disconnected";

function isUserRejection(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: number; rpcCode?: number };
  return err.code === 4001 || err.rpcCode === 4001;
}

export interface WalletContextValue {
  account: string;
  address: string;
  client: ReturnType<typeof createClient> | null;
  balance: string;
  rawWei: string;
  isConnected: boolean;
  isConnecting: boolean;
  wrongNetwork: boolean;
  connect: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  switchNetwork: () => Promise<void>;
  refreshAccount: () => Promise<string>;
  getSignerClient: () => ReturnType<typeof createClient> | null;
  assertStudionet: () => Promise<boolean>;
  formatAddress: (addr: string) => string;
}

const defaultWalletState: WalletContextValue = {
  account: "",
  address: "",
  client: null,
  balance: "",
  rawWei: "",
  isConnected: false,
  isConnecting: false,
  wrongNetwork: false,
  connect: async () => false,
  disconnect: async () => {},
  switchNetwork: async () => {},
  refreshAccount: async () => "",
  getSignerClient: () => null,
  assertStudionet: async () => false,
  formatAddress,
};

const WalletContext = createContext<WalletContextValue>(defaultWalletState);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<string>("");
  const [balance, setBalance] = useState<string>("");
  const [rawWei, setRawWei] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [wrongNetwork, setWrongNetwork] = useState(false);

  const checkNetworkAndBalance = useCallback(async (addr: string) => {
    if (typeof window === "undefined" || !window.ethereum || !addr) return;
    try {
      const chainIdHex = (await window.ethereum.request({ method: "eth_chainId" })) as string;
      const currentChainId = parseInt(chainIdHex, 16);
      const isWrong = currentChainId !== STUDIONET_CHAIN_ID;
      setWrongNetwork(isWrong);

      if (!isWrong) {
        const balHex = (await window.ethereum.request({
          method: "eth_getBalance",
          params: [addr, "latest"],
        })) as string;
        if (balHex) {
          setRawWei(balHex);
          setBalance(formatWei(BigInt(balHex)));
        }
      }
    } catch (err) {
      console.warn("Failed checking network or balance:", err);
    }
  }, []);

  const switchNetwork = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) return;
    const chainIdHex = `0x${STUDIONET_CHAIN_ID.toString(16)}`;

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainIdHex }],
      });
      setWrongNetwork(false);
      if (account) await checkNetworkAndBalance(account);
    } catch (switchError: unknown) {
      const err = switchError as { code?: number };
      if (err.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: chainIdHex,
                chainName: "GenLayer Studionet",
                nativeCurrency: {
                  name: "GEN",
                  symbol: "GEN",
                  decimals: 18,
                },
                rpcUrls: [STUDIONET_RPC],
                blockExplorerUrls: ["https://studio.genlayer.com"],
              },
            ],
          });
          setWrongNetwork(false);
          if (account) await checkNetworkAndBalance(account);
        } catch (addError) {
          console.error("Failed adding Studionet chain to wallet:", addError);
        }
      } else {
        console.error("Failed switching to Studionet:", switchError);
      }
    }
  }, [account, checkNetworkAndBalance]);

  const connect = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined" || !window.ethereum) {
      alert("No Ethereum-compatible wallet detected. Please install MetaMask or another Web3 extension.");
      return false;
    }

    setIsConnecting(true);
    try {
      window.sessionStorage.removeItem(DISCONNECT_KEY);
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];

      if (accounts && accounts.length > 0) {
        const addr = accounts[0];
        setAccount(addr);
        await checkNetworkAndBalance(addr);
        setIsConnecting(false);
        return true;
      }
    } catch (err) {
      if (!isUserRejection(err)) {
        console.error("Wallet connection error:", err);
      }
    }
    setIsConnecting(false);
    return false;
  }, [checkNetworkAndBalance]);

  const disconnect = useCallback(async () => {
    window.sessionStorage.setItem(DISCONNECT_KEY, "true");
    setAccount("");
    setBalance("");
    setRawWei("");
    setWrongNetwork(false);
  }, []);

  const refreshAccount = useCallback(async (): Promise<string> => {
    if (typeof window === "undefined" || !window.ethereum) return "";
    try {
      const accounts = (await window.ethereum.request({ method: "eth_accounts" })) as string[];
      if (accounts && accounts.length > 0) {
        const addr = accounts[0];
        setAccount(addr);
        await checkNetworkAndBalance(addr);
        return addr;
      }
    } catch (err) {
      console.warn("Failed refreshing account:", err);
    }
    return "";
  }, [checkNetworkAndBalance]);

  const assertStudionet = useCallback(async (): Promise<boolean> => {
    if (wrongNetwork) {
      await switchNetwork();
      return !wrongNetwork;
    }
    return true;
  }, [wrongNetwork, switchNetwork]);

  const getSignerClient = useCallback(() => {
    if (typeof window === "undefined" || !window.ethereum || !account) return null;
    return createClient({
      chain: studionet,
      endpoint: STUDIONET_RPC,
    });
  }, [account]);

  // Eagerly connect if previously connected and not explicitly disconnected
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;
    const isDisconnected = window.sessionStorage.getItem(DISCONNECT_KEY) === "true";
    if (isDisconnected) return;

    window.ethereum
      .request({ method: "eth_accounts" })
      .then((accs) => {
        const list = accs as string[];
        if (list && list.length > 0) {
          const addr = list[0];
          setAccount(addr);
          checkNetworkAndBalance(addr);
        }
      })
      .catch((err) => console.warn("Failed checking existing accounts:", err));

    const handleAccountsChanged = (accs: unknown) => {
      const list = accs as string[];
      if (list && list.length > 0) {
        setAccount(list[0]);
        checkNetworkAndBalance(list[0]);
      } else {
        setAccount("");
        setBalance("");
      }
    };

    const handleChainChanged = () => {
      if (account) checkNetworkAndBalance(account);
    };

    window.ethereum.on?.("accountsChanged", handleAccountsChanged);
    window.ethereum.on?.("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener?.("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [account, checkNetworkAndBalance]);

  const value = useMemo(
    () => ({
      account,
      address: account,
      client: getSignerClient(),
      balance,
      rawWei,
      isConnected: Boolean(account),
      isConnecting,
      wrongNetwork,
      connect,
      disconnect,
      switchNetwork,
      refreshAccount,
      getSignerClient,
      assertStudionet,
      formatAddress,
    }),
    [
      account,
      balance,
      rawWei,
      isConnecting,
      wrongNetwork,
      connect,
      disconnect,
      switchNetwork,
      refreshAccount,
      getSignerClient,
      assertStudionet,
    ]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletContextValue {
  return useContext(WalletContext);
}
