/**
 * GET /api/wallets - Get all wallet addresses and balances
 * 
 * Returns addresses and balances for facilitator, buyer, and seller wallets
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllBalances } from '@/lib/evm/wallet';

export async function GET(request: NextRequest) {
  try {
    const balances = await getAllBalances();

    return NextResponse.json(
      {
        success: true,
        wallets: balances,
        network: 'polkadot-hub-testnet',
        currency: 'PAS',
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch wallet balances',
        details: error instanceof Error ? error.message : 'Unknown error',
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

