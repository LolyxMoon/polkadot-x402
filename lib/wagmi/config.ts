/**
 * Wagmi configuration for Polkadot Hub TestNet
 */

import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';

// Polkadot Hub TestNet chain configuration
const polkadotHubTestnet = {
  id: 420420422,
  name: 'Polkadot Hub TestNet',
  nativeCurrency: {
    name: 'PAS',
    symbol: 'PAS',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-passet-hub-eth-rpc.polkadot.io'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Blockscout',
      url: 'https://blockscout-passet-hub.parity-testnet.parity.io',
    },
  },
  testnet: true,
} as const;

export const wagmiConfig = createConfig({
  chains: [polkadotHubTestnet],
  connectors: [
    injected({
      target: 'metaMask',
    }),
    injected(),
  ],
  transports: {
    [polkadotHubTestnet.id]: http('https://testnet-passet-hub-eth-rpc.polkadot.io'),
  },
});

