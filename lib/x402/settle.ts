/**
 * x402 Payment Settlement Logic
 * Handles settlement of verified payments by signing and broadcasting transactions
 */

import type { PaymentRequirements, SettlementResult } from '@/types/x402';
import { getNetworkConfig } from '@/lib/evm/networks';
import { settle } from 'x402/facilitator';
import { createSigner } from 'x402/types';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { env } from '@/lib/env';

/**
 * Settle an x402 payment by signing and broadcasting the transaction
 * 
 * This function:
 * - Parses the payment payload
 * - Constructs the blockchain transaction
 * - Signs with facilitator's wallet
 * - Broadcasts to the network
 * - Returns transaction hash
 */
export async function settleX402Payment(
  payload: string,
  requirements: PaymentRequirements
): Promise<SettlementResult> {
  try {
    // Validate requirements
    if (!requirements.x402Version || requirements.x402Version !== 1) {
      return {
        success: false,
        error: 'Unsupported x402 version. Only version 1 is supported.',
      };
    }

    if (!requirements.scheme) {
      return {
        success: false,
        error: 'Payment scheme is required.',
      };
    }

    if (!requirements.network) {
      return {
        success: false,
        error: 'Network is required.',
      };
    }

    // Get network configuration
    let networkConfig;
    try {
      networkConfig = getNetworkConfig(requirements.network);
    } catch (error) {
      return {
        success: false,
        error: `Unsupported network: ${requirements.network}`,
      };
    }

    // Handle different payment schemes
    if (requirements.scheme === 'exact') {
      return await settleExactPayment(payload, requirements, networkConfig);
    }

    return {
      success: false,
      error: `Unsupported payment scheme: ${requirements.scheme}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Settlement failed',
    };
  }
}

/**
 * Settle an "exact" scheme payment
 * This handles ERC-3009 transferWithAuthorization transactions
 */
async function settleExactPayment(
  payload: string,
  requirements: PaymentRequirements,
  networkConfig: any
): Promise<SettlementResult> {
  try {
    // Validate payload format
    if (!payload.startsWith('0x') || payload.length < 66) {
      return {
        success: false,
        error: 'Invalid payload format',
      };
    }

    // Validate hex format
    if (!/^0x[0-9a-fA-F]+$/.test(payload)) {
      return {
        success: false,
        error: 'Invalid payload format: must be valid hex string',
      };
    }

    // Create wallet client for facilitator (needs to sign transactions)
    const account = privateKeyToAccount(env.FACILITATOR_PRIVATE_KEY as `0x${string}`);
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

    // Create x402 signer using network and private key
    const signer = await createSigner(requirements.network, env.FACILITATOR_PRIVATE_KEY);

    // Settle payment using x402 SDK
    // The settle function calls transferWithAuthorization on the token contract
    // This executes the transfer that was authorized by the buyer's signature
    const settlementResult = await settle(
      signer,
      payload as any, // PaymentPayload type
      {
        scheme: requirements.scheme as 'exact',
        network: requirements.network as any, // Network type may be restricted
        maxAmountRequired: '0', // Amount already verified
        resource: '',
        description: '',
        mimeType: 'application/json',
        payTo: '',
        maxTimeoutSeconds: 300,
        asset: '',
        extra: requirements.extra || {},
      }
      // Config parameter removed - not needed for settlement
    );

    // Convert x402 SDK response to our SettlementResult format
    // The settle function returns { success: boolean, transaction: string, ... }
    if (settlementResult.success) {
      return {
        success: true,
        transactionHash: settlementResult.transaction,
      };
    } else {
      return {
        success: false,
        error: settlementResult.errorReason || 'Settlement failed',
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Settlement transaction failed',
    };
  }
}


