/**
 * API endpoint to create x402 payment authorization
 * Uses buyer's private key from environment variables to sign the payment
 * This keeps the private key secure on the server side
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSigner } from 'x402/types';
import { createPaymentHeader, preparePaymentHeader, signPaymentHeader } from 'x402/client';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { env } from '@/lib/env';
import { getNetworkConfig } from '@/lib/evm/networks';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Handle both { paymentRequirements: {...} } and direct paymentRequirements object
    const paymentRequirements = body.paymentRequirements || body;

    // Validate payment requirements
    if (!paymentRequirements || !paymentRequirements.network || !paymentRequirements.scheme) {
      console.error('Invalid payment requirements:', JSON.stringify({ body, paymentRequirements }, null, 2));
      return NextResponse.json(
        { error: 'Invalid payment requirements', received: { body, paymentRequirements } },
        { status: 400 }
      );
    }

    // Get network configuration
    const networkConfig = getNetworkConfig(paymentRequirements.network);

    // For custom networks not supported by x402 SDK, we need to use viem directly
    // Create wallet client from buyer's private key
    const account = privateKeyToAccount(env.BUYER_PRIVATE_KEY as `0x${string}`);
    const walletClient = createWalletClient({
      account,
      chain: {
        id: networkConfig.chainId,
        name: networkConfig.name,
        nativeCurrency: networkConfig.nativeCurrency,
        rpcUrls: {
          default: { http: [networkConfig.rpcUrl] },
        },
      },
      transport: http(networkConfig.rpcUrl),
    });

    // Try to use x402 SDK, but fallback to manual implementation for unsupported networks
    let paymentHeader: string;
    const x402Version = paymentRequirements.x402Version || 1;
    
    try {
      // Try using x402 SDK with a supported network name (will fail for custom networks)
      // For now, we'll use a workaround: use a supported network name but with our custom RPC
      // Actually, let's create the signer manually using viem and use preparePaymentHeader + signPaymentHeader
      const buyerAddress = account.address;
      
      // Prepare unsigned payment header
      const unsignedPayment = preparePaymentHeader(
        buyerAddress as `0x${string}`,
        x402Version,
        {
          scheme: paymentRequirements.scheme,
          network: paymentRequirements.network as any, // May not be in supported list
          maxAmountRequired: paymentRequirements.maxAmountRequired,
          resource: paymentRequirements.resource || '',
          description: paymentRequirements.description || '',
          mimeType: paymentRequirements.mimeType || 'application/json',
          payTo: paymentRequirements.payTo || '',
          maxTimeoutSeconds: paymentRequirements.maxTimeoutSeconds || 300,
          asset: paymentRequirements.asset || 'native',
          extra: paymentRequirements.extra || {},
        }
      );

      // Create a signer-like object from wallet client
      // We need to create a MultiNetworkSigner or use the wallet client directly
      // For now, let's try creating signer with a dummy network and then override
      const signer = await createSigner('base-sepolia', env.BUYER_PRIVATE_KEY);
      
      // Sign the payment header
      paymentHeader = await signPaymentHeader(
        signer,
        {
          scheme: paymentRequirements.scheme,
          network: paymentRequirements.network as any,
          maxAmountRequired: paymentRequirements.maxAmountRequired,
          resource: paymentRequirements.resource || '',
          description: paymentRequirements.description || '',
          mimeType: paymentRequirements.mimeType || 'application/json',
          payTo: paymentRequirements.payTo || '',
          maxTimeoutSeconds: paymentRequirements.maxTimeoutSeconds || 300,
          asset: paymentRequirements.asset || 'native',
          extra: paymentRequirements.extra || {},
        },
        unsignedPayment
      );
    } catch (sdkError: any) {
      // If SDK fails due to unsupported network, we need to implement manual signing
      // For now, throw a more helpful error
      throw new Error(
        `Failed to create payment header: ${sdkError.message}. ` +
        `Note: x402 SDK may not support custom networks. Network: ${paymentRequirements.network}`
      );
    }

    return NextResponse.json({
      paymentHeader,
      network: paymentRequirements.network,
    });
  } catch (error) {
    console.error('Error creating payment header:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create payment authorization',
        details: error instanceof Error ? error.message : 'Unknown error'
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

