/**
 * x402 Payment Settlement Logic
 * Handles settlement of verified payments by transferring native tokens
 */

import type { PaymentRequirements, SettlementResult } from '@/types/x402';
import { getNetworkConfig } from '@/lib/evm/networks';
import { getWallet } from '@/lib/evm/wallet';
import { ethers } from 'ethers';

/**
 * Settle an x402 payment by transferring native tokens
 * 
 * This function:
 * - Parses the payment payload to extract authorization
 * - Creates a native token transfer from buyer to seller
 * - Signs with facilitator's wallet
 * - Broadcasts to the network
 * - Returns transaction hash
 */
export async function settleX402Payment(
  payload: string,
  requirements: PaymentRequirements
): Promise<SettlementResult> {
  try {
    console.log('settleX402Payment: Starting settlement', {
      network: requirements.network,
      scheme: requirements.scheme,
      payloadLength: payload.length,
      payloadPrefix: payload.substring(0, 50),
    });

    // Validate requirements
    if (!requirements.x402Version || requirements.x402Version !== 1) {
      const error = 'Unsupported x402 version. Only version 1 is supported.';
      console.error('settleX402Payment: Validation failed', { error });
      return {
        success: false,
        error,
      };
    }

    if (!requirements.scheme) {
      const error = 'Payment scheme is required.';
      console.error('settleX402Payment: Validation failed', { error });
      return {
        success: false,
        error,
      };
    }

    if (!requirements.network) {
      const error = 'Network is required.';
      console.error('settleX402Payment: Validation failed', { error });
      return {
        success: false,
        error,
      };
    }

    // Get network configuration
    let networkConfig;
    try {
      networkConfig = getNetworkConfig(requirements.network);
      console.log('settleX402Payment: Network config', {
        chainId: networkConfig.chainId,
        name: networkConfig.name,
        rpcUrl: networkConfig.rpcUrl,
      });
    } catch (error) {
      const errorMsg = `Unsupported network: ${requirements.network}`;
      console.error('settleX402Payment: Network config failed', { error: errorMsg, originalError: error });
      return {
        success: false,
        error: errorMsg,
      };
    }

    // Handle different payment schemes
    if (requirements.scheme === 'exact') {
      return await settleExactPayment(payload, requirements, networkConfig);
    }

    const error = `Unsupported payment scheme: ${requirements.scheme}`;
    console.error('settleX402Payment: Unsupported scheme', { error });
    return {
      success: false,
      error,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Settlement failed';
    console.error('settleX402Payment: Unexpected error', {
      error: errorMsg,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Settle an "exact" scheme payment by transferring native tokens
 */
async function settleExactPayment(
  payload: string,
  requirements: PaymentRequirements,
  networkConfig: any
): Promise<SettlementResult> {
  try {
    console.log('settleExactPayment: Starting exact payment settlement', {
      payloadLength: payload.length,
      payloadType: typeof payload,
    });

    // Parse payload - can be base64-encoded JSON or hex string
    let paymentData: any;
    try {
      // Try to decode as base64 JSON
      if (!payload.startsWith('0x') && !payload.startsWith('{')) {
        const decoded = Buffer.from(payload, 'base64').toString('utf-8');
        paymentData = JSON.parse(decoded);
      } else if (payload.startsWith('{')) {
        paymentData = JSON.parse(payload);
      } else {
        const error = 'Invalid payload format: expected base64-encoded JSON';
        console.error('settleExactPayment: Payload parse failed', { error });
        return {
          success: false,
          error,
        };
      }
    } catch (error) {
      const errorMsg = 'Failed to parse payload: ' + (error instanceof Error ? error.message : 'Invalid format');
      console.error('settleExactPayment: Payload parse error', { error: errorMsg, originalError: error });
      return {
        success: false,
        error: errorMsg,
      };
    }

    // Extract authorization details
    const authorization = paymentData?.payload?.authorization || paymentData?.authorization;
    if (!authorization) {
      const error = 'Missing authorization in payload';
      console.error('settleExactPayment: Missing authorization', { error, paymentDataKeys: Object.keys(paymentData) });
      return {
        success: false,
        error,
      };
    }

    const from = authorization.from;
    const to = authorization.to || requirements.payTo;
    const amount = authorization.amount;

    if (!from || !to || !amount) {
      const error = 'Missing required fields in authorization';
      console.error('settleExactPayment: Missing fields', { error, from, to, amount });
      return {
        success: false,
        error,
      };
    }

    console.log('settleExactPayment: Extracted authorization', {
      from,
      to,
      amount,
      isNative: (requirements as any).asset === 'native' || !(requirements as any).asset,
    });

    // Check if this is a native token transfer
    const isNative = (requirements as any).asset === 'native' || 
                     !(requirements as any).asset ||
                     authorization.asset === '0x0000000000000000000000000000000000000000' ||
                     authorization.asset === 'native';

    if (isNative) {
      // Native token transfer - send PAS from buyer to seller
      console.log('settleExactPayment: Processing native token transfer', {
        from,
        to,
        amount,
        chainId: networkConfig.chainId,
      });

      // For native tokens, the buyer has signed an authorization
      // The facilitator needs to execute the transfer from buyer to seller
      // Since we have the buyer's signature, we can use it to create a transaction
      // However, for native tokens, we need the buyer to actually send the transaction
      // OR we can use a meta-transaction pattern
      
      // For now, we'll use the buyer's wallet to send the transaction
      // In production, you might use a meta-transaction relayer or the buyer sends it directly
      
      try {
        // Import buyer wallet to send the transaction
        const { getBuyerWallet } = await import('@/lib/evm/wallet');
        const buyerWallet = getBuyerWallet(requirements.network);
        const buyerAddress = await buyerWallet.getAddress();

        // Verify the from address matches the buyer
        if (from.toLowerCase() !== buyerAddress.toLowerCase()) {
          const error = `Authorization from address (${from}) does not match buyer address (${buyerAddress})`;
          console.error('settleExactPayment: Address mismatch', { error });
          return {
            success: false,
            error,
          };
        }

        // Check buyer's balance
        if (!buyerWallet.provider) {
          const error = 'Buyer wallet provider is not available';
          console.error('settleExactPayment: Provider unavailable', { error });
          return {
            success: false,
            error,
          };
        }
        const buyerBalance = await buyerWallet.provider.getBalance(buyerAddress);
        const amountBigInt = BigInt(amount);
        
        console.log('settleExactPayment: Buyer balance check', {
          buyerAddress,
          balance: buyerBalance.toString(),
          balanceFormatted: ethers.formatEther(buyerBalance),
          requiredAmount: amount,
          requiredAmountFormatted: ethers.formatEther(amountBigInt),
          hasEnough: buyerBalance >= amountBigInt,
        });

        if (buyerBalance < amountBigInt) {
          const error = `Insufficient buyer balance: has ${ethers.formatEther(buyerBalance)} PAS, needs ${ethers.formatEther(amountBigInt)} PAS`;
          console.error('settleExactPayment: Insufficient buyer balance', { error });
          return {
            success: false,
            error,
          };
        }

        // Create and send native token transfer from buyer to seller
        const tx = {
          to: to as string,
          value: amountBigInt,
        };

        console.log('settleExactPayment: Sending transaction from buyer to seller', {
          from: buyerAddress,
          to: tx.to,
          value: tx.value.toString(),
          valueFormatted: ethers.formatEther(tx.value),
        });

        const txResponse = await buyerWallet.sendTransaction(tx);
        console.log('settleExactPayment: Transaction sent', {
          hash: txResponse.hash,
          from: txResponse.from,
          to: txResponse.to,
        });

        // Wait for transaction confirmation
        const receipt = await txResponse.wait();
        
        if (!receipt || !receipt.hash) {
          const error = 'Transaction failed: no receipt hash';
          console.error('settleExactPayment: Transaction failed', { error });
          return {
            success: false,
            error,
          };
        }

        console.log('settleExactPayment: Transaction confirmed', {
          hash: receipt.hash,
          blockNumber: receipt.blockNumber,
          status: receipt.status,
        });

        return {
          success: true,
          transactionHash: receipt.hash,
        };
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Transaction failed';
        console.error('settleExactPayment: Transaction error', {
          error: errorMsg,
          stack: error instanceof Error ? error.stack : undefined,
        });
        return {
          success: false,
          error: errorMsg,
        };
      }
    } else {
      // ERC20 token transfer - would need to call transferWithAuthorization on token contract
      const error = 'ERC20 token settlement not yet implemented';
      console.error('settleExactPayment: ERC20 not implemented', { error });
      return {
        success: false,
        error,
      };
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Settlement transaction failed';
    console.error('settleExactPayment: Unexpected error', {
      error: errorMsg,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return {
      success: false,
      error: errorMsg,
    };
  }
}
