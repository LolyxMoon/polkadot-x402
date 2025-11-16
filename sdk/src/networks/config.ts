/**
 * Network configuration registry and getter functions
 */

import { POLKADOT_NETWORKS } from './polkadot';
import type { NetworkConfig, NetworkId } from './types';

/**
 * Get network configuration by network ID
 */
export function getNetworkConfig(networkId: string): NetworkConfig {
  // Check if it's a known Polkadot network
  if (networkId in POLKADOT_NETWORKS) {
    return POLKADOT_NETWORKS[networkId];
  }

  // Try to find by partial match (case-insensitive)
  const normalizedId = networkId.toLowerCase();
  const found = Object.entries(POLKADOT_NETWORKS).find(
    ([key]) => key.toLowerCase() === normalizedId
  );

  if (found) {
    return found[1];
  }

  throw new Error(
    `Network "${networkId}" is not supported. Supported networks: ${Object.keys(POLKADOT_NETWORKS).join(', ')}`
  );
}

/**
 * Get all supported network IDs
 */
export function getSupportedNetworks(): NetworkId[] {
  return Object.keys(POLKADOT_NETWORKS) as NetworkId[];
}

/**
 * Check if a network is supported
 */
export function isNetworkSupported(networkId: string): boolean {
  try {
    getNetworkConfig(networkId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get all network configurations
 */
export function getAllNetworks(): Record<string, NetworkConfig> {
  return { ...POLKADOT_NETWORKS };
}

