/**
 * API endpoint to create x402 payment authorization using polkadot-x402 SDK
 * Uses buyer's private key from environment variables to sign the payment
 * This keeps the private key secure on the server side
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSignerFromPrivateKey, createPaymentHeader } from '../../../../sdk/src';
import { createSigner } from 'x402/types';
import { preparePaymentHeader, signPaymentHeader } from 'x402/client';
import { env } from '@/lib/env';
import { privateKeyToAccount } from 'viem/accounts';

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

    // Use the network ID from payment requirements
    const networkId = paymentRequirements.network;

    // Extract payment details
    const payTo = paymentRequirements.payTo;
    const amount = paymentRequirements.maxAmountRequired || '0';

    if (!payTo) {
      return NextResponse.json(
        { error: 'Missing payTo address in payment requirements' },
        { status: 400 }
      );
    }

    // For EVM-compatible networks, use the old x402 SDK (EVM-compatible)
    // For native Polkadot networks, use the new polkadot-x402 SDK
    const isEVMCompatible = networkId === 'polkadot-hub-testnet';
    
    let paymentHeader: string;
    let buyerAddress: string;

    if (isEVMCompatible) {
      // Use old x402 SDK for EVM-compatible networks
      // Note: x402 SDK requires a supported network name, so we use 'base-sepolia' 
      // as a proxy since it's EVM-compatible. The actual network is polkadot-hub-testnet
      const account = privateKeyToAccount(env.BUYER_PRIVATE_KEY as `0x${string}`);
      buyerAddress = account.address;

      const x402Version = paymentRequirements.x402Version || 1;
      
      // Map to a supported network for x402 SDK (it needs a recognized network name)
      // We use 'base-sepolia' as a proxy since it's EVM-compatible
      // The actual network details are in the payment requirements
      const x402NetworkName = 'base-sepolia' as any;
      
      // Prepare unsigned payment header
      const unsignedPayment = preparePaymentHeader(
        buyerAddress as `0x${string}`,
        x402Version,
        {
          scheme: paymentRequirements.scheme,
          network: x402NetworkName, // Use supported network name for SDK
          maxAmountRequired: amount,
          resource: paymentRequirements.resource || '',
          description: paymentRequirements.description || '',
          mimeType: paymentRequirements.mimeType || 'application/json',
          payTo: payTo,
          maxTimeoutSeconds: paymentRequirements.maxTimeoutSeconds || 300,
          asset: paymentRequirements.asset || 'native',
          extra: {
            ...paymentRequirements.extra,
            actualNetwork: networkId, // Store actual network in extra
          },
        }
      );

      // Create signer using old x402 SDK with supported network name
      const signer = await createSigner(x402NetworkName, env.BUYER_PRIVATE_KEY);
      
      // Sign the payment header (use the same network name for signing)
      paymentHeader = await signPaymentHeader(
        signer,
        {
          scheme: paymentRequirements.scheme,
          network: x402NetworkName, // Use supported network name
          maxAmountRequired: amount,
          resource: paymentRequirements.resource || '',
          description: paymentRequirements.description || '',
          mimeType: paymentRequirements.mimeType || 'application/json',
          payTo: payTo,
          maxTimeoutSeconds: paymentRequirements.maxTimeoutSeconds || 300,
          asset: paymentRequirements.asset || 'native',
          extra: {
            ...paymentRequirements.extra,
            actualNetwork: networkId, // Store actual network in extra
          },
        },
        unsignedPayment
      );
    } else {
      // Use new polkadot-x402 SDK for native Polkadot networks
      const signer = createSignerFromPrivateKey(env.BUYER_PRIVATE_KEY, networkId);
      buyerAddress = signer.address;

      const paymentResult = await createPaymentHeader(signer, {
        from: signer.address,
        to: payTo,
        amount,
        requirements: {
          ...paymentRequirements,
          network: networkId,
        },
      });

      paymentHeader = paymentResult.paymentHeader;
    }

    return NextResponse.json({
      paymentHeader,
      network: paymentRequirements.network,
      address: buyerAddress,
    });
  } catch (error) {
    console.error('Error creating payment header:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: 'Failed to create payment authorization',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
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

