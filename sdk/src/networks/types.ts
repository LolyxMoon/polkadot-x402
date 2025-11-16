/**
 * Network type definitions
 */

export interface NetworkConfig {
  name: string;
  chainId?: string;
  rpcUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  explorerUrl?: string;
  ss58Format?: number;
}

export type NetworkId = 
  | 'polkadot'
  | 'kusama'
  | 'westend'
  | 'polkadot-testnet';

