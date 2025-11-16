/**
 * API endpoint to create x402 payment authorization
 * Uses buyer's private key to sign EIP-712 payment authorization
 * Returns base64-encoded payment header
 */

import { NextRequest, NextResponse } from 'next/server';
import { signPaymentAuthorization } from '@/lib/x402/sign';
import { getBuyerAddress } from '@/lib/evm/wallet';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Handle both { paymentRequirements: {...} } and direct paymentRequirements object
    const paymentRequirements = body.paymentRequirements || body;

    // Validate payment requirements
    if (!paymentRequirements || !paymentRequirements.network || !paymentRequirements.scheme) {
      return NextResponse.json(
        { error: 'Invalid payment requirements', received: { body, paymentRequirements } },
        { status: 400 }
      );
    }

    // Extract payment details
    const payTo = paymentRequirements.payTo;
    if (!payTo) {
      return NextResponse.json(
        { error: 'Missing payTo address in payment requirements' },
        { status: 400 }
      );
    }

    // Sign payment authorization using our custom EIP-712 signing
    const paymentHeader = await signPaymentAuthorization(
      paymentRequirements,
      paymentRequirements.network
    );

    // Get buyer address
    const buyerAddress = await getBuyerAddress(paymentRequirements.network);

    return NextResponse.json({
      paymentHeader,
      network: paymentRequirements.network,
      address: buyerAddress,
    });
  } catch (error) {
    console.error('Error creating payment header:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create payment authorization',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

