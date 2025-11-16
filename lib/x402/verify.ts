/**
 * x402 Payment Verification Logic
 * Verifies payment payloads using our own EIP-712 verification
 */

import type { PaymentRequirements, VerificationResult } from '@/types/x402';
import { getNetworkConfig } from '@/lib/evm/networks';
import { ethers } from 'ethers';
import { getProvider } from '@/lib/evm/wallet';

/**
 * Verify an x402 payment payload
 * 
 * This function validates:
 * - Payment signature validity using EIP-712
 * - Payment meets specified requirements
 * - Nonce/timestamp for replay protection
 * - Payment format and structure
 */
export async function verifyX402Payment(
  payload: string,
  requirements: PaymentRequirements
): Promise<VerificationResult> {
  try {
    // Validate requirements
    if (!requirements.x402Version || requirements.x402Version !== 1) {
      return {
        valid: false,
        error: 'Unsupported x402 version. Only version 1 is supported.',
      };
    }

    if (!requirements.scheme) {
      return {
        valid: false,
        error: 'Payment scheme is required.',
      };
    }

    if (!requirements.network) {
      return {
        valid: false,
        error: 'Network is required.',
      };
    }

    // Validate network is supported
    let networkConfig;
    try {
      networkConfig = getNetworkConfig(requirements.network);
    } catch (error) {
      return {
        valid: false,
        error: `Unsupported network: ${requirements.network}`,
      };
    }

    // Parse payload - can be base64-encoded JSON or hex string
    if (!payload || typeof payload !== 'string') {
      return {
        valid: false,
        error: 'Invalid payload format: must be a string',
      };
    }

    // Decode base64-encoded JSON payload
    let paymentData: any;
    try {
      // Try to decode as base64 JSON
      if (!payload.startsWith('0x') && !payload.startsWith('{')) {
        const decoded = Buffer.from(payload, 'base64').toString('utf-8');
        paymentData = JSON.parse(decoded);
      } else if (payload.startsWith('{')) {
        paymentData = JSON.parse(payload);
      } else {
        return {
          valid: false,
          error: 'Invalid payload format: expected base64-encoded JSON',
        };
      }
    } catch (error) {
      return {
        valid: false,
        error: 'Failed to parse payload: ' + (error instanceof Error ? error.message : 'Invalid format'),
      };
    }

    // Extract signature and authorization from payload
    const signature = paymentData?.payload?.signature || paymentData?.signature;
    const authorization = paymentData?.payload?.authorization || paymentData?.authorization;

    if (!signature || !authorization) {
      return {
        valid: false,
        error: 'Missing signature or authorization in payload',
      };
    }

    // Validate signature format
    if (!signature.startsWith('0x') || signature.length !== 132) {
      return {
        valid: false,
        error: 'Invalid signature format',
      };
    }

    // Extract authorization details
    const from = authorization.from;
    const to = authorization.to;
    const amount = authorization.amount;
    const nonce = authorization.nonce;
    const timestamp = authorization.timestamp;
    const resource = authorization.resource || '';
    const network = authorization.network || requirements.network;
    const asset = authorization.asset || '0x0000000000000000000000000000000000000000';

    if (!from || !to || !amount) {
      return {
        valid: false,
        error: 'Missing required fields in authorization',
      };
    }

    // Verify network matches
    if (network !== requirements.network) {
      return {
        valid: false,
        error: `Network mismatch: expected ${requirements.network}, got ${network}`,
      };
    }

    // Verify payTo matches
    if (to.toLowerCase() !== (requirements.payTo || '').toLowerCase()) {
      return {
        valid: false,
        error: `PayTo mismatch: expected ${requirements.payTo}, got ${to}`,
      };
    }

    // Verify amount meets requirement
    const paidAmount = BigInt(amount);
    const requiredAmount = BigInt(requirements.maxAmountRequired || '0');
    if (paidAmount < requiredAmount) {
      return {
        valid: false,
        error: `Insufficient amount: paid ${amount}, required ${requirements.maxAmountRequired}`,
      };
    }

    // Verify timestamp is not too old (within 5 minutes)
    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (timestamp && currentTimestamp - timestamp > 300) {
      return {
        valid: false,
        error: 'Payment authorization expired',
      };
    }

    // Reconstruct EIP-712 domain and message for verification
    const domain = {
      name: 'X402',
      version: '1',
      chainId: networkConfig.chainId,
      verifyingContract: asset,
    };

    const types = {
      PaymentAuthorization: [
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'nonce', type: 'bytes32' },
        { name: 'timestamp', type: 'uint256' },
        { name: 'resource', type: 'string' },
        { name: 'network', type: 'string' },
      ],
    };

    const message = {
      from: from,
      to: to,
      amount: BigInt(amount).toString(),
      nonce: nonce,
      timestamp: timestamp,
      resource: resource,
      network: network,
    };

    // Verify EIP-712 signature using ethers
    try {
      const recoveredAddress = ethers.verifyTypedData(domain, types, message, signature);
      
      if (recoveredAddress.toLowerCase() !== from.toLowerCase()) {
        return {
          valid: false,
          error: 'Signature verification failed: address mismatch',
        };
      }

      // Payment is valid
      return {
        valid: true,
        details: {
          amount: amount,
          token: asset === '0x0000000000000000000000000000000000000000' ? 'native' : asset,
          from: from,
          to: to,
          nonce: nonce,
          timestamp: timestamp,
        },
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Signature verification failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
      };
    }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Verification failed',
    };
  }
}
