/**
 * Next.js Middleware - x402 Payment Interceptor
 * 
 * This middleware intercepts all incoming requests and checks for x402 payments
 * on protected routes. Routes can be protected by adding them to PROTECTED_ROUTES.
 * 
 * Based on x402 protocol specifications:
 * - Checks for X-402-Payment header
 * - Returns 402 Payment Required if payment is missing or invalid
 * - Allows request to proceed if payment is valid
 */

import { NextRequest, NextResponse } from 'next/server';
// Middleware calls facilitator endpoints via HTTP, not SDK directly
import { getWalletAddress, getSellerAddress } from './lib/evm/wallet';
import { getNetworkConfig } from './lib/evm/networks';
import { env } from './lib/env';
import type { PaymentRequirements } from './types/x402';

/**
 * Routes that require x402 payment protection
 * Add route patterns here to protect them
 */
const PROTECTED_ROUTES = [
  '/api/protected/weather',
];

/**
 * Payment configuration per route
 * Can be customized per endpoint
 */
const ROUTE_PAYMENT_CONFIG: Record<string, {
  amount: string;
  token?: string;
  description?: string;
}> = {
  '/api/protected/weather': {
    amount: '1000000000000000000', // 1 PAS token (18 decimals)
    description: 'Access to weather API endpoint',
  },
};

/**
 * Check if a route requires x402 payment protection
 */
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Extract payment from request headers
 * x402 protocol uses X-402-Payment header and optionally X-402-Payment-Details
 */
function extractPayment(request: NextRequest): {
  payload: string | null;
  details: PaymentRequirements | null;
} {
  // Check for X-402-Payment header (standard x402 header)
  const paymentHeader = request.headers.get('X-402-Payment');
  const detailsHeader = request.headers.get('X-402-Payment-Details');
  
  if (!paymentHeader) {
    return { payload: null, details: null };
  }

  // Try to parse payment details from X-402-Payment-Details header first
  let paymentDetails: PaymentRequirements | null = null;
  if (detailsHeader) {
    try {
      paymentDetails = JSON.parse(detailsHeader) as PaymentRequirements;
    } catch {
      // Invalid JSON, will use defaults
    }
  }

  try {
    // Try to decode base64 first (x402 SDK returns base64-encoded JSON)
    let decodedHeader = paymentHeader;
    try {
      // Check if it's base64 encoded
      if (!paymentHeader.startsWith('0x') && !paymentHeader.startsWith('{')) {
        decodedHeader = Buffer.from(paymentHeader, 'base64').toString('utf-8');
      }
    } catch {
      // Not base64, use as-is
    }

    // Parse the payment header (can be JSON or just the payload)
    const parsed = JSON.parse(decodedHeader);
    
    if (parsed.payload && parsed.details) {
      return {
        payload: parsed.payload,
        details: parsed.details as PaymentRequirements,
      };
    }
    
    // If it's just a string payload, use details from header or defaults
    if (typeof parsed === 'string') {
      return {
        payload: parsed,
        details: paymentDetails || {
          x402Version: 1,
          scheme: 'exact',
          network: env.NETWORK,
        },
      };
    }

    // If parsed is an object with x402Version, scheme, network, payload, etc.
    // This is the format from x402 SDK's signPaymentHeader
    if (parsed.x402Version && parsed.payload) {
      return {
        payload: parsed.payload,
        details: {
          x402Version: parsed.x402Version,
          scheme: parsed.scheme,
          network: parsed.network,
          maxAmountRequired: parsed.maxAmountRequired || '',
          resource: parsed.resource || '',
          description: parsed.description || '',
          mimeType: parsed.mimeType || 'application/json',
          payTo: parsed.payTo || '',
          maxTimeoutSeconds: parsed.maxTimeoutSeconds || 300,
          asset: parsed.asset || '',
          extra: parsed.extra || {},
        } as PaymentRequirements,
      };
    }
  } catch {
    // If parsing fails, treat as raw payload string
    if (paymentHeader.startsWith('0x')) {
      return {
        payload: paymentHeader,
        details: paymentDetails || {
          x402Version: 1,
          scheme: 'exact',
          network: env.NETWORK,
        },
      };
    }
  }

  return { payload: null, details: null };
}

/**
 * Create 402 Payment Required response
 */
async function create402Response(
  request: NextRequest,
  config: { amount: string; token?: string; description?: string }
): Promise<NextResponse> {
  const network = env.NETWORK;
  const networkConfig = getNetworkConfig(network);
  
  // Seller address receives payments (payTo)
  const sellerAddress = await getSellerAddress(network);
  
  // Use configured facilitator URL
  const facilitatorUrl = env.FACILITATOR_URL;
  
  // Use configured token address, or override from config
  const tokenAddress = config.token || env.TOKEN_ADDRESS;

  const response = {
    maxAmountRequired: config.amount,
    resource: request.nextUrl.pathname,
    description: config.description || 'Access to this resource requires payment',
    payTo: sellerAddress,
    asset: tokenAddress,
    network,
    x402Version: 1,
    scheme: 'exact',
    facilitator: facilitatorUrl,
    mimeType: 'application/json',
    maxTimeoutSeconds: 300,
  };

  return NextResponse.json(response, {
    status: 402,
    headers: {
      'Content-Type': 'application/json',
      'X-402-Version': '1',
      'X-402-Scheme': 'exact',
      'X-402-Network': network,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': request.method,
      'Access-Control-Allow-Headers': 'Content-Type, X-402-Payment',
    },
  });
}

/**
 * Next.js Middleware
 * Intercepts all requests and checks for x402 payment on protected routes
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for non-protected routes
  if (!isProtectedRoute(pathname)) {
    return NextResponse.next();
  }

  // Get payment configuration for this route
  const paymentConfig = ROUTE_PAYMENT_CONFIG[pathname] || {
    amount: '1000000000000000000', // Default: 1 PAS token
    description: 'Access to this resource requires payment',
  };

  // Extract payment from request
  const { payload, details } = extractPayment(request);

  // If no payment provided, return 402 Payment Required
  if (!payload || !details) {
    return await create402Response(request, paymentConfig);
  }

  // Merge payment details with payment config to create full requirements
  // Preserve values from payment details to ensure verification matches what was signed
  const sellerAddress = await getSellerAddress(env.NETWORK);
  const fullPaymentRequirements: PaymentRequirements & Record<string, any> = {
    ...details,
    // Override only if not provided in details, to ensure verification matches signed payment
    maxAmountRequired: (details as any).maxAmountRequired || paymentConfig.amount,
    resource: (details as any).resource || pathname,
    description: (details as any).description || paymentConfig.description || 'Access to this resource requires payment',
    payTo: (details as any).payTo || sellerAddress,
    asset: (details as any).asset || paymentConfig.token || env.TOKEN_ADDRESS,
    mimeType: (details as any).mimeType || 'application/json',
    maxTimeoutSeconds: (details as any).maxTimeoutSeconds || 300,
    // Ensure required fields are set
    x402Version: details.x402Version || 1,
    scheme: details.scheme || 'exact',
    network: details.network || env.NETWORK,
  };

  // Debug logging
  const payloadStr = typeof payload === 'string' ? payload : ((payload as any)?.payload || JSON.stringify(payload));
  console.log('Middleware: Verifying payment', {
    payloadLength: payloadStr.length,
    payloadPrefix: payloadStr.substring(0, 20),
    payloadType: typeof payload,
    network: fullPaymentRequirements.network,
    scheme: fullPaymentRequirements.scheme,
    payTo: fullPaymentRequirements.payTo,
    amount: fullPaymentRequirements.maxAmountRequired,
  });

  // Verify the payment by calling the facilitator verify endpoint
  // Prepare payload for verification (must be a string)
  let payloadForVerification: string;
  if (typeof payload === 'string') {
    payloadForVerification = payload;
  } else if (payload && typeof payload === 'object') {
    // If it's the full payment object, stringify it
    if ((payload as any).x402Version && (payload as any).payload) {
      payloadForVerification = JSON.stringify(payload);
    } else {
      // Just payload part - reconstruct full object
      payloadForVerification = JSON.stringify({
        x402Version: fullPaymentRequirements.x402Version || 1,
        scheme: fullPaymentRequirements.scheme || 'exact',
        network: fullPaymentRequirements.network,
        payload: payload,
      });
    }
  } else {
    payloadForVerification = JSON.stringify(payload);
  }

  // Call facilitator verify endpoint
  // Ensure FACILITATOR_URL is the base path, not the settle endpoint
  let facilitatorBaseUrl = env.FACILITATOR_URL || '/api/facilitator';
  // Remove any trailing paths to ensure we have the base URL
  if (facilitatorBaseUrl.includes('/settle') || facilitatorBaseUrl.includes('/verify')) {
    facilitatorBaseUrl = facilitatorBaseUrl.split('/').slice(0, -1).join('/') || '/api/facilitator';
  }
  const verifyUrl = `${facilitatorBaseUrl}/verify`;
  
  let verification: { valid: boolean; error?: string; details?: any };
  try {
    const verifyResponse = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        payload: payloadForVerification,
        details: fullPaymentRequirements,
      }),
    });

    if (!verifyResponse.ok) {
      const errorData = await verifyResponse.json().catch(() => ({}));
      verification = {
        valid: false,
        error: errorData.error || `Verification failed: ${verifyResponse.statusText}`,
      };
    } else {
      verification = await verifyResponse.json();
    }
  } catch (error) {
    verification = {
      valid: false,
      error: error instanceof Error ? error.message : 'Verification request failed',
    };
  }
  
  console.log('Middleware: Verification result', {
    valid: verification.valid,
    error: verification.error,
    details: verification.details,
  });

  // If payment is invalid, return 402 with error details
  if (!verification.valid) {
    const network = env.NETWORK;
    const sellerAddress = await getSellerAddress(network);
    // For native tokens, use "native" string (not an address)
    // The client will convert this to zero address when creating payment
    const tokenAddress = paymentConfig.token || env.TOKEN_ADDRESS;
    
    // Sanitize error message to avoid invalid header values
    const errorMessage = verification.error || 'Invalid payment';
    const sanitizedError = errorMessage.replace(/\n/g, ' ').substring(0, 200);
    
    return NextResponse.json(
      {
        error: 'Payment verification failed',
        details: sanitizedError,
        maxAmountRequired: paymentConfig.amount,
        resource: pathname,
        payTo: sellerAddress,
        asset: tokenAddress,
        network,
        x402Version: 1,
        scheme: 'exact',
        facilitator: env.FACILITATOR_URL,
        mimeType: 'application/json',
        maxTimeoutSeconds: 300,
      },
      {
        status: 402,
        headers: {
          'Content-Type': 'application/json',
          'X-402-Error': sanitizedError,
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  // Payment is valid - check if amount meets requirement
  if (verification.details) {
    const paidAmount = BigInt(verification.details.amount || '0');
    const requiredAmount = BigInt(paymentConfig.amount);

    if (paidAmount < requiredAmount) {
      const network = env.NETWORK;
      const sellerAddress = await getSellerAddress(network);
      const tokenAddress = paymentConfig.token || env.TOKEN_ADDRESS;
      
      return NextResponse.json(
        {
          error: 'Insufficient payment amount',
          paid: verification.details.amount,
          required: paymentConfig.amount,
          maxAmountRequired: paymentConfig.amount,
          resource: pathname,
          payTo: sellerAddress,
          asset: tokenAddress,
          network,
          x402Version: 1,
          scheme: 'exact',
          facilitator: env.FACILITATOR_URL,
          mimeType: 'application/json',
          maxTimeoutSeconds: 300,
        },
        {
          status: 402,
          headers: {
            'Content-Type': 'application/json',
            'X-402-Error': 'Insufficient payment',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Check token if specified
    const expectedToken = paymentConfig.token || env.TOKEN_ADDRESS;
    if (verification.details.token) {
      if (verification.details.token.toLowerCase() !== expectedToken.toLowerCase()) {
        const network = env.NETWORK;
        const sellerAddress = await getSellerAddress(network);
        
        return NextResponse.json(
          {
            error: 'Invalid payment token',
            expected: expectedToken,
            received: verification.details.token,
            maxAmountRequired: paymentConfig.amount,
            resource: pathname,
            payTo: sellerAddress,
            asset: expectedToken,
            network,
            x402Version: 1,
            scheme: 'exact',
            facilitator: env.FACILITATOR_URL,
            mimeType: 'application/json',
            maxTimeoutSeconds: 300,
          },
          {
            status: 402,
            headers: {
              'Content-Type': 'application/json',
              'X-402-Error': 'Invalid token',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }
    }
  }

  // Payment verified successfully - now settle the payment via facilitator endpoint
  // Prepare payload for settlement (must be a string)
  let payloadForSettlement: string;
  if (typeof payload === 'string') {
    payloadForSettlement = payload;
  } else if (payload && typeof payload === 'object') {
    if ((payload as any).x402Version && (payload as any).payload) {
      payloadForSettlement = JSON.stringify(payload);
    } else {
      payloadForSettlement = JSON.stringify({
        x402Version: fullPaymentRequirements.x402Version || 1,
        scheme: fullPaymentRequirements.scheme || 'exact',
        network: fullPaymentRequirements.network,
        payload: payload,
      });
    }
  } else {
    payloadForSettlement = JSON.stringify(payload);
  }

  // Call facilitator settle endpoint (use same base URL)
  const settleUrl = `${facilitatorBaseUrl}/settle`;
  
  let settlement: { success: boolean; transactionHash?: string; error?: string };
  try {
    const settleResponse = await fetch(settleUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        payload: payloadForSettlement,
        details: fullPaymentRequirements,
      }),
    });

    if (!settleResponse.ok) {
      const errorData = await settleResponse.json().catch(() => ({}));
      settlement = {
        success: false,
        error: errorData.error || `Settlement failed: ${settleResponse.statusText}`,
      };
    } else {
      settlement = await settleResponse.json();
    }
  } catch (error) {
    settlement = {
      success: false,
      error: error instanceof Error ? error.message : 'Settlement request failed',
    };
  }

  if (!settlement.success) {
    // Settlement failed - return error
    const network = env.NETWORK;
    const sellerAddress = await getSellerAddress(network);
    const tokenAddress = paymentConfig.token || env.TOKEN_ADDRESS;
    
    return NextResponse.json(
      {
        error: 'Payment settlement failed',
        details: settlement.error,
        maxAmountRequired: paymentConfig.amount,
        resource: pathname,
        payTo: sellerAddress,
        asset: tokenAddress,
        network,
        x402Version: 1,
        scheme: 'exact',
        facilitator: env.FACILITATOR_URL,
        mimeType: 'application/json',
        maxTimeoutSeconds: 300,
      },
      {
        status: 402,
        headers: {
          'Content-Type': 'application/json',
          'X-402-Error': settlement.error || 'Settlement failed',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  // Payment verified and settled successfully - add headers and allow request to proceed
  const response = NextResponse.next();
  response.headers.set('X-Payment-Verified', 'true');
  response.headers.set('X-Payment-Amount', verification.details?.amount || '0');
  if (settlement.transactionHash) {
    response.headers.set('X-Settlement-Tx', settlement.transactionHash);
    // Also set X-Payment-Response header as per x402 spec
    response.headers.set('X-Payment-Response', JSON.stringify({
      transactionHash: settlement.transactionHash,
      settled: true,
    }));
  }
  
  return response;
}

/**
 * Configure which routes the middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

