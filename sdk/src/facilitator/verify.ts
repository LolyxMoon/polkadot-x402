/**
 * Payment verification logic for Polkadot
 */

import { ApiPromise, WsProvider } from '@polkadot/api';
import type { PaymentRequirements, VerificationResult } from '../types';
import { getNetworkConfig } from '../networks/config';
import { decodePaymentPayload, verifySignature, createPaymentHash } from '../utils/crypto';
import { validatePaymentRequirements } from '../utils/validation';

/**
 * Verify an x402 payment payload
 */
export async function verifyX402Payment(
  payload: string,
  requirements: PaymentRequirements
): Promise<VerificationResult> {
  try {
    // Validate requirements
    const validation = validatePaymentRequirements(requirements);
    if (!validation.valid) {
      return {
        valid: false,
        error: validation.error || 'Invalid payment requirements',
      };
    }

    // Validate x402 version
    if (requirements.x402Version !== 1) {
      return {
        valid: false,
        error: 'Unsupported x402 version. Only version 1 is supported.',
      };
    }

    // Validate scheme
    if (requirements.scheme !== 'exact') {
      return {
        valid: false,
        error: `Unsupported payment scheme: ${requirements.scheme}. Only 'exact' is supported.`,
      };
    }

    // Validate network
    let networkConfig;
    try {
      networkConfig = getNetworkConfig(requirements.network);
    } catch (error) {
      return {
        valid: false,
        error: `Unsupported network: ${requirements.network}`,
      };
    }

    // Decode payment payload
    const paymentData = decodePaymentPayload(payload);
    if (!paymentData) {
      return {
        valid: false,
        error: 'Invalid payload format. Could not decode payment data.',
      };
    }

    // Validate payment data structure
    if (!paymentData.from || !paymentData.to || !paymentData.amount || !paymentData.signature) {
      return {
        valid: false,
        error: 'Invalid payment payload. Missing required fields.',
      };
    }

    // Verify payTo matches
    if (requirements.payTo && paymentData.to.toLowerCase() !== requirements.payTo.toLowerCase()) {
      return {
        valid: false,
        error: 'Payment recipient does not match requirements.',
      };
    }

    // Verify amount meets requirement
    if (requirements.maxAmountRequired) {
      const paidAmount = BigInt(paymentData.amount);
      const requiredAmount = BigInt(requirements.maxAmountRequired);
      if (paidAmount < requiredAmount) {
        return {
          valid: false,
          error: `Payment amount ${paymentData.amount} is less than required ${requirements.maxAmountRequired}`,
        };
      }
    }

    // Verify timestamp is not too old
    const maxTimeout = requirements.maxTimeoutSeconds || 300;
    const ageSeconds = (Date.now() - paymentData.timestamp) / 1000;
    if (ageSeconds > maxTimeout) {
      return {
        valid: false,
        error: `Payment timestamp is too old. Age: ${ageSeconds}s, max: ${maxTimeout}s`,
      };
    }

    // Create payment hash for signature verification
    const paymentHash = createPaymentHash({
      from: paymentData.from,
      to: paymentData.to,
      amount: paymentData.amount,
      nonce: paymentData.nonce,
      timestamp: paymentData.timestamp,
      network: requirements.network,
      resource: requirements.resource,
    });

    // Verify signature
    const isValid = verifySignature(
      paymentHash,
      paymentData.signature,
      paymentData.from
    );

    if (!isValid) {
      return {
        valid: false,
        error: 'Invalid payment signature.',
      };
    }

    // Optionally verify on-chain that the account exists and has sufficient balance
    // This is optional but recommended for production
    try {
      const api = await ApiPromise.create({ provider: new WsProvider(networkConfig.rpcUrl) });
      const accountInfo = await api.query.system.account(paymentData.from);
      const balance = (accountInfo as any).data.free.toBigInt();
      const requiredAmount = BigInt(paymentData.amount);
      
      if (balance < requiredAmount) {
        await api.disconnect();
        return {
          valid: false,
          error: 'Insufficient balance for payment.',
        };
      }
      await api.disconnect();
    } catch (error) {
      // If on-chain verification fails, we still consider the signature valid
      // but log the error
      console.warn('On-chain balance verification failed:', error);
    }

    // Payment is valid
    return {
      valid: true,
      details: {
        amount: paymentData.amount,
        token: requirements.asset || 'native',
        from: paymentData.from,
        to: paymentData.to,
        nonce: paymentData.nonce,
        timestamp: paymentData.timestamp,
      },
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Verification failed',
    };
  }
}

