/**
 * Payment header creation and signing logic
 */

import { u8aToHex } from '@polkadot/util';
import type { PaymentRequirements, PolkadotSigner } from '../types';
import type { CreatePaymentHeaderOptions, PaymentHeaderResult } from './types';
import { createPaymentHash, encodePaymentPayload } from '../utils/crypto';

/**
 * Create a payment header for x402 protocol
 */
export async function createPaymentHeader(
  signer: PolkadotSigner,
  options: CreatePaymentHeaderOptions
): Promise<PaymentHeaderResult> {
  const {
    from,
    to,
    amount,
    requirements,
    nonce,
    timestamp = Date.now(),
  } = options;

  // Generate nonce if not provided
  const paymentNonce = nonce || generateNonce();

  // Create payment hash
  const paymentHash = createPaymentHash({
    from: signer.address,
    to,
    amount,
    nonce: paymentNonce,
    timestamp,
    network: requirements.network,
    resource: requirements.resource,
  });

  // Sign the payment hash
  const signature = await signer.sign(paymentHash);
  const signatureHex = u8aToHex(signature);

  // Create payment payload
  const payload = {
    from: signer.address,
    to,
    amount,
    nonce: paymentNonce,
    timestamp,
    signature: signatureHex,
  };

  // Encode payload to hex string
  const encodedPayload = encodePaymentPayload(payload);

  return {
    paymentHeader: encodedPayload,
    payload: encodedPayload,
    signature: signatureHex,
  };
}

/**
 * Generate a random nonce
 */
function generateNonce(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

