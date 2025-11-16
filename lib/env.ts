/**
 * Environment variable validation and configuration
 * Required keys: FACILITATOR_PRIVATE_KEY, BUYER_PRIVATE_KEY, SELLER_ADDRESS
 * SELLER_PRIVATE_KEY is optional - only needed if you need to sign with seller wallet
 * All other values are hardcoded for Polkadot Hub TestNet
 */

import { ethers } from 'ethers';

function requireEnv(key: string, allowNextPublic: boolean = false): string {
  // First try the regular key (server-side)
  let value = process.env[key];
  
  // If not found and allowNextPublic is true, try NEXT_PUBLIC_ prefix (client-side)
  if (!value && allowNextPublic) {
    value = process.env[`NEXT_PUBLIC_${key}`];
  }
  
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}${allowNextPublic ? ` or NEXT_PUBLIC_${key}` : ''}`);
  }
  return value;
}

function getEnv(key: string, allowNextPublic: boolean = false, defaultValue?: string): string | undefined {
  // First try the regular key (server-side)
  let value = process.env[key];
  
  // If not found and allowNextPublic is true, try NEXT_PUBLIC_ prefix (client-side)
  if (!value && allowNextPublic) {
    value = process.env[`NEXT_PUBLIC_${key}`];
  }
  
  // Return value if it exists and is not empty, otherwise return defaultValue or undefined
  return (value && value.trim()) || defaultValue;
}

function validatePrivateKey(key: string, name: string): void {
  if (!key.startsWith('0x')) {
    throw new Error(`${name} must start with 0x`);
  }
  if (key.length !== 66) {
    throw new Error(`${name} must be 66 characters (0x + 64 hex chars)`);
  }
}

// Compute public addresses from private keys
function getAddressFromPrivateKey(privateKey: string): string {
  try {
    const wallet = new ethers.Wallet(privateKey);
    return wallet.address;
  } catch (error) {
    throw new Error(`Invalid private key format`);
  }
}

export const env = {
  // Required - Facilitator wallet (signs settlement transactions)
  // SERVER-ONLY: Never use NEXT_PUBLIC_ prefix for private keys
  FACILITATOR_PRIVATE_KEY: requireEnv('FACILITATOR_PRIVATE_KEY'),
  
  // Required - Buyer wallet (makes payments)
  // SERVER-ONLY: Never use NEXT_PUBLIC_ prefix for private keys
  BUYER_PRIVATE_KEY: requireEnv('BUYER_PRIVATE_KEY'),
  
  // Optional - Seller wallet private key (only needed if seller needs to sign transactions)
  // SERVER-ONLY: Never use NEXT_PUBLIC_ prefix for private keys
  SELLER_PRIVATE_KEY: getEnv('SELLER_PRIVATE_KEY'),
  
  // Required - Seller wallet address (receives payments)
  // Can be provided directly via SELLER_ADDRESS or NEXT_PUBLIC_SELLER_ADDRESS
  // Or derived from SELLER_PRIVATE_KEY if available
  SELLER_ADDRESS: getEnv('SELLER_ADDRESS', true) || getEnv('NEXT_PUBLIC_SELLER_ADDRESS') || undefined,
  
  // Required - Facilitator URL (for settlement endpoint)
  // Can be accessed from client-side if NEXT_PUBLIC_FACILITATOR_URL is set
  // Server-side falls back to FACILITATOR_URL if NEXT_PUBLIC_ version not available
  FACILITATOR_URL: requireEnv('FACILITATOR_URL', true),
  
  // Required - Token address (use 'native' for native token/PAS, or ERC20 token address)
  // Can be accessed from client-side if NEXT_PUBLIC_TOKEN_ADDRESS is set
  // Server-side falls back to TOKEN_ADDRESS if NEXT_PUBLIC_ version not available
  TOKEN_ADDRESS: requireEnv('TOKEN_ADDRESS', true),
  
  // Hardcoded for Polkadot Hub TestNet
  NETWORK: 'polkadot-hub-testnet' as const,
};

// Validate required private keys
validatePrivateKey(env.FACILITATOR_PRIVATE_KEY, 'FACILITATOR_PRIVATE_KEY');
validatePrivateKey(env.BUYER_PRIVATE_KEY, 'BUYER_PRIVATE_KEY');

// Validate seller private key if provided
if (env.SELLER_PRIVATE_KEY) {
  validatePrivateKey(env.SELLER_PRIVATE_KEY, 'SELLER_PRIVATE_KEY');
}

// Compute and export public addresses
export const addresses = {
  facilitator: getAddressFromPrivateKey(env.FACILITATOR_PRIVATE_KEY),
  buyer: getAddressFromPrivateKey(env.BUYER_PRIVATE_KEY),
  seller: env.SELLER_ADDRESS || (env.SELLER_PRIVATE_KEY ? getAddressFromPrivateKey(env.SELLER_PRIVATE_KEY) : ''),
};

// Validate seller address is available
if (!addresses.seller) {
  throw new Error('SELLER_ADDRESS or SELLER_PRIVATE_KEY must be provided');
}

