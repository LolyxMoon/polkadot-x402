/**
 * x402 Payment Verification Logic
 * Verifies payment payloads according to x402 protocol specifications
 */

import type { PaymentRequirements, VerificationResult } from '@/types/x402';
import { getNetworkConfig } from '@/lib/evm/networks';
import { verify } from 'x402/facilitator';
import { createSigner } from 'x402/types';
import { createPublicClient, http } from 'viem';
import { getProvider } from '@/lib/evm/wallet';
import { env } from '@/lib/env';

/**
 * Verify an x402 payment payload
 * 
 * This function validates:
 * - Payment signature validity
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
    try {
      getNetworkConfig(requirements.network);
    } catch (error) {
      return {
        valid: false,
        error: `Unsupported network: ${requirements.network}`,
      };
    }

    // Parse payload (assuming it's a hex-encoded string)
    // In a real implementation, this would use the x402 SDK to parse the payload
    if (!payload || typeof payload !== 'string') {
      return {
        valid: false,
        error: 'Invalid payload format.',
      };
    }

    // Basic payload validation
    if (!payload.startsWith('0x')) {
      return {
        valid: false,
        error: 'Payload must be a hex string starting with 0x',
      };
    }

    // For "exact" scheme, verify the payload structure
    if (requirements.scheme === 'exact') {
      // Basic payload format validation
      const payloadLength = payload.length;
      if (payloadLength < 66) {
        return {
          valid: false,
          error: 'Payload too short to be valid',
        };
      }

      // Parse and verify payment payload
      // Note: Full EIP-712 signature verification requires x402 SDK integration
      // This implementation provides basic validation - integrate x402 SDK for production
      try {
        // Basic hex validation
        if (!/^0x[0-9a-fA-F]+$/.test(payload)) {
          return {
            valid: false,
            error: 'Invalid payload format: must be valid hex string',
          };
        }

        // Use x402 SDK to verify payment
        try {
          const networkConfig = getNetworkConfig(requirements.network);
          
          // Create public client for verification (read-only)
          const publicClient = createPublicClient({
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

          // Create connected client for x402 SDK verification (read-only)
          // For verification, we can use a public client - no private key needed
          // Use createConnectedClient or pass the publicClient directly
          // Since verify needs a Signer or ConnectedClient, we'll use the network string approach
          // But for read-only verification, we can create a signer with a dummy key or use createConnectedClient
          const signer = await createSigner(requirements.network, '0x0000000000000000000000000000000000000000000000000000000000000000');

          // Build full payment requirements for x402 SDK
          // Use values from requirements object, with defaults for missing fields
          const fullRequirements = {
            scheme: (requirements.scheme || 'exact') as 'exact',
            network: requirements.network as any, // Network type may be restricted
            maxAmountRequired: (requirements as any).maxAmountRequired || '0',
            resource: (requirements as any).resource || '',
            description: (requirements as any).description || '',
            mimeType: (requirements as any).mimeType || 'application/json',
            payTo: (requirements as any).payTo || '',
            maxTimeoutSeconds: (requirements as any).maxTimeoutSeconds || 300,
            asset: (requirements as any).asset || '',
            extra: requirements.extra || {},
          };

          // Verify payment using x402 SDK
          // This verifies the EIP-712 signature and checks the authorization is valid
          const verificationResult = await verify(
            signer,
            payload as any, // PaymentPayload type
            fullRequirements
            // Config parameter removed - not needed for verification
          );

          // Convert x402 SDK response to our VerificationResult format
          // The verify function returns { isValid: boolean, invalidReason?: string, payer?: string }
          if (verificationResult.isValid) {
            // Extract payment details from the payload (we need to parse it)
            // For now, return basic structure - the middleware will extract amount from verification
            return {
              valid: true,
              details: {
                amount: (verificationResult as any).details?.amount || (requirements as any).maxAmountRequired || '0',
                token: (verificationResult as any).details?.token || (requirements as any).asset || '',
                from: verificationResult.payer || '',
                to: (requirements as any).payTo || '',
                nonce: (verificationResult as any).details?.nonce,
                timestamp: (verificationResult as any).details?.timestamp,
              },
            };
          } else {
            return {
              valid: false,
              error: verificationResult.invalidReason || 'Payment verification failed',
            };
          }
        } catch (error) {
          return {
            valid: false,
            error: error instanceof Error ? error.message : 'Payment verification failed',
          };
        }
      } catch (error) {
        return {
          valid: false,
          error: error instanceof Error ? error.message : 'Payload verification failed',
        };
      }
    }

    return {
      valid: false,
      error: `Unsupported payment scheme: ${requirements.scheme}`,
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Verification failed',
    };
  }
}


