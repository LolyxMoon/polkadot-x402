/**
 * EVM Network configurations
 * Polkadot Hub TestNet facilitator only
 */

export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

/**
 * Polkadot Hub TestNet configuration
 */
export const STANDARD_NETWORKS: Record<string, NetworkConfig> = {
  'polkadot-hub-testnet': {
    name: 'Polkadot Hub TestNet',
    chainId: 420420422,
    rpcUrl: 'https://testnet-passet-hub-eth-rpc.polkadot.io',
    nativeCurrency: {
      name: 'PAS',
      symbol: 'PAS',
      decimals: 18,
    },
  },
};

/**
 * Get network configuration for Polkadot Hub TestNet
 */
export function getNetworkConfig(network: string): NetworkConfig {
  // Only support Polkadot Hub TestNet
  if (network === 'polkadot-hub-testnet' && STANDARD_NETWORKS[network]) {
    return STANDARD_NETWORKS[network];
  }

  // Default fallback to Polkadot Hub TestNet
  if (STANDARD_NETWORKS['polkadot-hub-testnet']) {
    return STANDARD_NETWORKS['polkadot-hub-testnet'];
  }

  throw new Error(
    `Network "${network}" is not supported. Only Polkadot Hub TestNet is supported.`
  );
}

/**
 * Get all supported networks
 */
export function getSupportedNetworks(): string[] {
  return Object.keys(STANDARD_NETWORKS);
}

