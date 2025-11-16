/**
 * Polkadot signer creation utilities
 */

import { Keyring } from '@polkadot/keyring';
import type { KeyringPair } from '@polkadot/keyring/types';
import { hexToU8a } from '@polkadot/util';
import type { PolkadotSigner } from '../types';
import { getNetworkConfig } from '../networks/config';
import { signMessage } from '../utils/crypto';

/**
 * Create a signer from a private key
 */
export function createSignerFromPrivateKey(
  privateKey: string,
  networkId: string
): PolkadotSigner {
  const networkConfig = getNetworkConfig(networkId);
  const keyring = new Keyring({ type: 'sr25519', ss58Format: networkConfig.ss58Format || 0 });
  
  // Handle different private key formats
  let pair: KeyringPair;
  if (privateKey.startsWith('0x')) {
    // Hex format
    pair = keyring.addFromSeed(hexToU8a(privateKey));
  } else if (privateKey.length === 64) {
    // Raw hex without 0x
    pair = keyring.addFromSeed(hexToU8a('0x' + privateKey));
  } else {
    // Mnemonic or other format
    pair = keyring.addFromUri(privateKey);
  }

  return {
    address: pair.address,
    sign: async (message: Uint8Array | string) => {
      const messageU8a = typeof message === 'string' 
        ? new TextEncoder().encode(message) 
        : message;
      return pair.sign(messageU8a);
    },
    signMessage: async (message: string) => {
      return signMessage(message, pair);
    },
  };
}

