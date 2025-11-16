/**
 * GET /api/facilitator/supported
 * Returns the payment kinds supported by this facilitator
 * 
 * Response format per x402 protocol:
 * [
 *   {
 *     "x402Version": 1,
 *     "scheme": "exact",
 *     "network": "polkadot-hub-testnet",
 *     "extra": {}
 *   }
 * ]
 */

import { NextRequest, NextResponse } from 'next/server';
import type { SupportedPayment } from '@/types/x402';
import { getSupportedNetworks } from '@/lib/evm/networks';
import { env } from '@/lib/env';

export async function GET(request: NextRequest) {
  try {
    const supportedPayments: SupportedPayment[] = [];

    // Get all standard networks
    const standardNetworks = getSupportedNetworks();
    
    // Add standard networks
    for (const network of standardNetworks) {
      supportedPayments.push({
        x402Version: 1,
        scheme: 'exact',
        network,
        extra: {},
      });
    }

    // If no networks configured, return at least the default
    if (supportedPayments.length === 0) {
      supportedPayments.push({
        x402Version: 1,
        scheme: 'exact',
        network: env.NETWORK,
        extra: {},
      });
    }

    return NextResponse.json(supportedPayments, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to get supported payments',
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

