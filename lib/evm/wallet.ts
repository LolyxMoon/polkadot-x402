/**
 * EVM Wallet and Provider Management
 * Handles wallet initialization with support for custom chains
 */

import { ethers } from 'ethers';
import { env } from '@/lib/env';
import { getNetworkConfig } from './networks';

let wallet: ethers.Wallet | null = null;
let provider: ethers.JsonRpcProvider | null = null;
let currentNetwork: string | null = null;

/**
 * Get or create RPC provider for a specific network
 */
export function getProvider(network?: string): ethers.JsonRpcProvider {
  const networkId = network || env.NETWORK;
  
  // Reuse provider if same network
  if (provider && currentNetwork === networkId) {
    return provider;
  }

  const networkConfig = getNetworkConfig(networkId);
  
  // Create custom network configuration for ethers
  const customNetwork = {
    name: networkConfig.name,
    chainId: networkConfig.chainId,
  };

  // Create provider with custom network
  provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl, customNetwork, {
    staticNetwork: ethers.Network.from(customNetwork),
  });
  
  currentNetwork = networkId;
  
  return provider;
}

/**
 * Get or create facilitator wallet instance
 * Wallet is initialized with the default network but can be used with any network
 */
export function getWallet(network?: string): ethers.Wallet {
  const networkId = network || env.NETWORK;
  
  if (!wallet) {
    const provider = getProvider(networkId);
    wallet = new ethers.Wallet(env.FACILITATOR_PRIVATE_KEY, provider);
    currentNetwork = networkId;
  } else if (networkId !== currentNetwork) {
    // Update provider if network changed
    const provider = getProvider(networkId);
    wallet = wallet.connect(provider);
    currentNetwork = networkId;
  }
  
  return wallet;
}

/**
 * Get buyer wallet instance
 */
export function getBuyerWallet(network?: string): ethers.Wallet {
  const networkId = network || env.NETWORK;
  const provider = getProvider(networkId);
  return new ethers.Wallet(env.BUYER_PRIVATE_KEY, provider);
}

/**
 * Get seller wallet instance
 */
export function getSellerWallet(network?: string): ethers.Wallet {
  const networkId = network || env.NETWORK;
  const provider = getProvider(networkId);
  return new ethers.Wallet(env.SELLER_PRIVATE_KEY, provider);
}

/**
 * Get facilitator wallet address
 */
export async function getWalletAddress(network?: string): Promise<string> {
  const wallet = getWallet(network);
  return await wallet.getAddress();
}

/**
 * Get buyer wallet address
 */
export async function getBuyerAddress(network?: string): Promise<string> {
  const buyerWallet = getBuyerWallet(network);
  return await buyerWallet.getAddress();
}

/**
 * Get seller wallet address
 */
export async function getSellerAddress(network?: string): Promise<string> {
  const sellerWallet = getSellerWallet(network);
  return await sellerWallet.getAddress();
}

/**
 * Get balance for a wallet address
 */
export async function getBalance(address: string, network?: string): Promise<bigint> {
  const provider = getProvider(network);
  return await provider.getBalance(address);
}

/**
 * Get all wallet addresses (facilitator, buyer, seller)
 */
export async function getAllAddresses(network?: string): Promise<{
  facilitator: string;
  buyer: string;
  seller: string;
}> {
  const [facilitator, buyer, seller] = await Promise.all([
    getWalletAddress(network),
    getBuyerAddress(network),
    getSellerAddress(network),
  ]);

  return {
    facilitator,
    buyer,
    seller,
  };
}

/**
 * Get all wallet balances (facilitator, buyer, seller)
 */
export async function getAllBalances(network?: string): Promise<{
  facilitator: { address: string; balance: bigint; balanceFormatted: string };
  buyer: { address: string; balance: bigint; balanceFormatted: string };
  seller: { address: string; balance: bigint; balanceFormatted: string };
}> {
  const addresses = await getAllAddresses(network);
  const provider = getProvider(network);

  const [facilitatorBalance, buyerBalance, sellerBalance] = await Promise.all([
    provider.getBalance(addresses.facilitator),
    provider.getBalance(addresses.buyer),
    provider.getBalance(addresses.seller),
  ]);

  const formatBalance = (balance: bigint): string => {
    return ethers.formatEther(balance);
  };

  return {
    facilitator: {
      address: addresses.facilitator,
      balance: facilitatorBalance,
      balanceFormatted: formatBalance(facilitatorBalance),
    },
    buyer: {
      address: addresses.buyer,
      balance: buyerBalance,
      balanceFormatted: formatBalance(buyerBalance),
    },
    seller: {
      address: addresses.seller,
      balance: sellerBalance,
      balanceFormatted: formatBalance(sellerBalance),
    },
  };
}

/**
 * Reset wallet and provider (useful for testing or network switching)
 */
export function resetWallet(): void {
  wallet = null;
  provider = null;
  currentNetwork = null;
}

