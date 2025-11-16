/**
 * Cryptographic utilities for Polkadot
 */

import { u8aToHex, hexToU8a } from '@polkadot/util';
import { signatureVerify } from '@polkadot/util-crypto';
import type { KeyringPair } from '@polkadot/keyring/types';

/**
 * Sign a message with a keyring pair
 */
export function signMessage(
  message: string | Uint8Array,
  keypair: KeyringPair
): string {
  const messageU8a = typeof message === 'string' ? new TextEncoder().encode(message) : message;
  const signature = keypair.sign(messageU8a);
  return u8aToHex(signature);
}

/**
 * Verify a signature
 */
export function verifySignature(
  message: string | Uint8Array,
  signature: string,
  address: string
): boolean {
  try {
    const messageU8a = typeof message === 'string' ? new TextEncoder().encode(message) : message;
    const signatureU8a = hexToU8a(signature);
    const result = signatureVerify(messageU8a, signatureU8a, address);
    return result.isValid;
  } catch {
    return false;
  }
}

/**
 * Create structured data hash for EIP-712-like signing
 * This creates a deterministic hash of payment requirements
 */
export function createPaymentHash(requirements: {
  from: string;
  to: string;
  amount: string;
  nonce: string;
  timestamp: number;
  network: string;
  resource?: string;
}): Uint8Array {
  // Create a structured message similar to EIP-712
  const message = JSON.stringify({
    domain: {
      name: 'X402',
      version: '1',
      chainId: requirements.network,
    },
    message: {
      from: requirements.from,
      to: requirements.to,
      amount: requirements.amount,
      nonce: requirements.nonce,
      timestamp: requirements.timestamp,
      resource: requirements.resource || '',
    },
    primaryType: 'Payment',
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'string' },
      ],
      Payment: [
        { name: 'from', type: 'string' },
        { name: 'to', type: 'string' },
        { name: 'amount', type: 'string' },
        { name: 'nonce', type: 'string' },
        { name: 'timestamp', type: 'uint256' },
        { name: 'resource', type: 'string' },
      ],
    },
  });

  return new TextEncoder().encode(message);
}

/**
 * Encode payment payload to hex string
 */
export function encodePaymentPayload(payload: {
  from: string;
  to: string;
  amount: string;
  nonce: string;
  timestamp: number;
  signature: string;
}): string {
  const data = JSON.stringify(payload);
  return u8aToHex(new TextEncoder().encode(data));
}

/**
 * Decode payment payload from hex string
 */
export function decodePaymentPayload(payloadHex: string): {
  from: string;
  to: string;
  amount: string;
  nonce: string;
  timestamp: number;
  signature: string;
} | null {
  try {
    const data = hexToU8a(payloadHex);
    const json = new TextDecoder().decode(data);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

