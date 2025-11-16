/**
 * Native Polkadot network configurations
 */

import type { NetworkConfig } from './types';

export const POLKADOT_NETWORKS: Record<string, NetworkConfig> = {
  polkadot: {
    name: 'Polkadot',
    chainId: 'polkadot',
    rpcUrl: 'wss://rpc.polkadot.io',
    nativeCurrency: {
      name: 'DOT',
      symbol: 'DOT',
      decimals: 10,
    },
    explorerUrl: 'https://polkascan.io/polkadot',
    ss58Format: 0,
  },
  kusama: {
    name: 'Kusama',
    chainId: 'kusama',
    rpcUrl: 'wss://kusama-rpc.polkadot.io',
    nativeCurrency: {
      name: 'KSM',
      symbol: 'KSM',
      decimals: 12,
    },
    explorerUrl: 'https://polkascan.io/kusama',
    ss58Format: 2,
  },
  westend: {
    name: 'Westend',
    chainId: 'westend',
    rpcUrl: 'wss://westend-rpc.polkadot.io',
    nativeCurrency: {
      name: 'WND',
      symbol: 'WND',
      decimals: 12,
    },
    explorerUrl: 'https://polkascan.io/westend',
    ss58Format: 42,
  },
  'polkadot-testnet': {
    name: 'Polkadot Testnet',
    chainId: 'polkadot-testnet',
    rpcUrl: 'wss://rpc.polkadot.io',
    nativeCurrency: {
      name: 'DOT',
      symbol: 'DOT',
      decimals: 10,
    },
    explorerUrl: 'https://polkascan.io/polkadot',
    ss58Format: 0,
  },
  'polkadot-hub-testnet': {
    name: 'Polkadot Hub TestNet',
    chainId: '420420422',
    rpcUrl: 'https://testnet-passet-hub-eth-rpc.polkadot.io',
    nativeCurrency: {
      name: 'PAS',
      symbol: 'PAS',
      decimals: 18,
    },
    explorerUrl: 'https://blockscout-passet-hub.parity-testnet.parity.io',
    ss58Format: 0, // EVM-compatible, uses Ethereum address format
  },
};

