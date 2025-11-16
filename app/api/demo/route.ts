/**
 * GET /api/demo - Returns information about the demo endpoint
 * POST /api/demo - Simulates the complete x402 payment flow for demo purposes
 * 
 * This endpoint simulates the verify + settle flow with realistic timing and responses
 * for demonstration purposes without requiring actual blockchain transactions.
 */

import { NextRequest, NextResponse } from 'next/server';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generate a realistic transaction hash
function generateTxHash(): string {
  return '0x' + Array.from({ length: 64 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      endpoint: '/api/demo',
      description: 'Simulates x402 payment flow for demo purposes',
      methods: ['GET', 'POST'],
      note: 'This is a test endpoint that simulates the verify + settle flow without actual blockchain transactions',
    },
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  );
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    
    // Validate payload exists
    if (!body.payload || typeof body.payload !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid payload field', code: 'INVALID_PAYLOAD' },
        { status: 400 }
      );
    }

    // Validate details
    if (!body.details || typeof body.details !== 'object') {
      return NextResponse.json(
        { error: 'Missing or invalid details field', code: 'INVALID_DETAILS' },
        { status: 400 }
      );
    }

    // Validate x402 version
    if (!body.details.x402Version || body.details.x402Version !== 1) {
      return NextResponse.json(
        { error: 'Invalid x402Version. Only version 1 is supported.', code: 'INVALID_VERSION' },
        { status: 400 }
      );
    }

    // Step 1: Simulate verification
    const verifyStart = Date.now();
    await delay(200 + Math.random() * 200); // 200-400ms
    const verifyTime = Date.now() - verifyStart;

    // Validate payload format
    if (!body.payload.startsWith('0x') || body.payload.length < 66) {
      return NextResponse.json(
        { 
          valid: false, 
          error: 'Invalid payload format. Payload must be a hex string starting with 0x',
        },
        { 
          status: 400,
          headers: {
            'X-Verification-Time': `${verifyTime}ms`,
          },
        }
      );
    }

    // Step 2: Simulate settlement
    const settleStart = Date.now();
    await delay(150 + Math.random() * 100); // 150-250ms
    const settlementTime = Date.now() - settleStart;

    const totalTime = Date.now() - startTime;
    const apiProcessingTime = totalTime - verifyTime - settlementTime;

    // Generate transaction hash
    const transactionHash = generateTxHash();

    // Build response headers
    const responseHeaders: Record<string, string> = {
      'cache-control': 'no-cache',
      'content-type': 'application/json',
      'date': new Date().toUTCString(),
      'server': 'Vercel',
      'x-payment-response': 'verified-and-settled',
      'x-settlement-time': `${settlementTime}ms`,
      'x-vercel-cache': 'MISS',
      'x-vercel-id': Array.from({ length: 16 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join(''),
      'x-verification-time': `${verifyTime}ms`,
    };

    // Return success response
    return NextResponse.json(
      {
        success: true,
        valid: true,
        transactionHash,
        details: {
          amount: '1000000000000000000', // 1 token (18 decimals)
          token: '0x' + Array.from({ length: 40 }, () => 
            Math.floor(Math.random() * 16).toString(16)
          ).join(''),
          from: '0x' + Array.from({ length: 40 }, () => 
            Math.floor(Math.random() * 16).toString(16)
          ).join(''),
          to: '0x' + Array.from({ length: 40 }, () => 
            Math.floor(Math.random() * 16).toString(16)
          ).join(''),
          nonce: '0x' + Array.from({ length: 16 }, () => 
            Math.floor(Math.random() * 16).toString(16)
          ).join(''),
          timestamp: Math.floor(Date.now() / 1000),
        },
        timing: {
          total: totalTime,
          verification: verifyTime,
          settlement: settlementTime,
          apiProcessing: apiProcessingTime,
        },
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          ...responseHeaders,
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        valid: false,
        error: error instanceof Error ? error.message : 'Demo request failed',
        code: 'INTERNAL_ERROR',
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

