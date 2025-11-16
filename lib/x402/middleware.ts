/**
 * x402 Payment Protection Middleware
 * Protects API endpoints by requiring x402 payment
 */

import { NextRequest } from 'next/server';
import type { PaymentRequirements } from '@/types/x402';
import { verifyX402Payment } from './verify';
import { getWalletAddress } from '@/lib/evm/wallet';
import { getNetworkConfig } from '@/lib/evm/networks';

/**
 * Payment requirement configuration
 */
export interface PaymentConfig {
  amount: string; // Amount in smallest unit (e.g., wei for ETH)
  token?: string; // Token contract address (optional, defaults to native token)
  network: string; // Network identifier
  description?: string; // Description of what the payment is for
}

/**
 * Extract payment payload from request headers
 * x402 protocol typically uses X-402-Payment header
 */
export function extractPaymentFromRequest(request: NextRequest): {
  payload: string | null;
  details: PaymentRequirements | null;
} {
  // Check for x402 payment header
  const paymentHeader = request.headers.get('X-402-Payment');
  const detailsHeader = request.headers.get('X-402-Payment-Details');

  if (!paymentHeader) {
    return { payload: null, details: null };
  }

  let details: PaymentRequirements | null = null;
  
  if (detailsHeader) {
    try {
      details = JSON.parse(detailsHeader);
    } catch {
      // Invalid JSON, will be handled in verification
    }
  }

  return {
    payload: paymentHeader,
    details,
  };
}

/**
 * Generate 402 Payment Required response
 */
export async function generate402Response(
  resource: string,
  config: PaymentConfig
): Promise<Response> {
  const networkConfig = getNetworkConfig(config.network);
  const facilitatorAddress = await getWalletAddress(config.network);

  const response = {
    maxAmountRequired: config.amount,
    resource,
    description: config.description || 'Access to this resource requires payment.',
    payTo: facilitatorAddress,
    asset: config.token || 'native', // 'native' means native token (PAS for Polkadot Hub)
    network: config.network,
    x402Version: 1,
    scheme: 'exact',
    extra: {},
  };

  return new Response(JSON.stringify(response), {
    status: 402,
    headers: {
      'Content-Type': 'application/json',
      'X-402-Required': 'true',
    },
  });
}

/**
 * Protect an endpoint with x402 payment requirement
 */
export async function protectWithX402(
  request: NextRequest,
  resource: string,
  config: PaymentConfig
): Promise<{ authorized: boolean; response?: Response; paymentDetails?: any }> {
  // Extract payment from request
  const { payload, details } = extractPaymentFromRequest(request);

  // If no payment provided, return 402
  if (!payload || !details) {
    const response = await generate402Response(resource, config);
    return { authorized: false, response };
  }

  // Verify payment requirements match config
  if (details.network !== config.network) {
    const response = await generate402Response(resource, config);
    return { authorized: false, response };
  }

  // Verify the payment payload
  const verificationResult = await verifyX402Payment(payload, details);

  if (!verificationResult.valid) {
    // Payment invalid, return 402 again
    const response = await generate402Response(resource, config);
    return { authorized: false, response };
  }

  // Payment is valid, check if amount meets requirement
  if (verificationResult.details) {
    const paidAmount = BigInt(verificationResult.details.amount || '0');
    const requiredAmount = BigInt(config.amount);

    if (paidAmount < requiredAmount) {
      const response = await generate402Response(resource, config);
      return { authorized: false, response };
    }

    // Check token matches if specified
    if (config.token && verificationResult.details.token) {
      if (verificationResult.details.token.toLowerCase() !== config.token.toLowerCase()) {
        const response = await generate402Response(resource, config);
        return { authorized: false, response };
      }
    }
  }

  // Payment verified and meets requirements
  return {
    authorized: true,
    paymentDetails: verificationResult.details,
  };
}
