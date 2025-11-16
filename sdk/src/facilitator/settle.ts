/**
 * Payment settlement logic for Polkadot
 */

import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { hexToU8a } from '@polkadot/util';
import type { PaymentRequirements, SettlementResult } from '../types';
import { getNetworkConfig } from '../networks/config';
import { decodePaymentPayload } from '../utils/crypto';
import { createTransferExtrinsic, signAndSendTransaction, getAccountNonce } from '../utils/substrate';
import { validatePaymentRequirements } from '../utils/validation';

/**
 * Settle an x402 payment by executing the transfer on-chain
 */
export async function settleX402Payment(
  payload: string,
  requirements: PaymentRequirements,
  facilitatorPrivateKey: string
): Promise<SettlementResult> {
  try {
    // Validate requirements
    const validation = validatePaymentRequirements(requirements);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error || 'Invalid payment requirements',
      };
    }

    // Validate x402 version
    if (requirements.x402Version !== 1) {
      return {
        success: false,
        error: 'Unsupported x402 version. Only version 1 is supported.',
      };
    }

    // Validate scheme
    if (requirements.scheme !== 'exact') {
      return {
        success: false,
        error: `Unsupported payment scheme: ${requirements.scheme}. Only 'exact' is supported.`,
      };
    }

    // Get network configuration
    const networkConfig = getNetworkConfig(requirements.network);

    // Decode payment payload
    const paymentData = decodePaymentPayload(payload);
    if (!paymentData) {
      return {
        success: false,
        error: 'Invalid payload format. Could not decode payment data.',
      };
    }

    // Create API instance
    const api = await ApiPromise.create({
      provider: new WsProvider(networkConfig.rpcUrl),
    });

    try {
      // Create keyring and facilitator account
      const keyring = new Keyring({
        type: 'sr25519',
        ss58Format: networkConfig.ss58Format || 0,
      });

      let facilitatorPair;
      if (facilitatorPrivateKey.startsWith('0x')) {
        facilitatorPair = keyring.addFromSeed(
          hexToU8a(facilitatorPrivateKey)
        );
      } else if (facilitatorPrivateKey.length === 64) {
        facilitatorPair = keyring.addFromSeed(
          hexToU8a('0x' + facilitatorPrivateKey)
        );
      } else {
        facilitatorPair = keyring.addFromUri(facilitatorPrivateKey);
      }

      // Convert amount to bigint (handle decimals)
      const amount = BigInt(paymentData.amount);

      // Create transfer extrinsic
      const transferExtrinsic = await createTransferExtrinsic(
        api,
        paymentData.to,
        amount
      );

      // Get nonce for facilitator account
      const nonce = await getAccountNonce(api, facilitatorPair.address);

      // Sign and send transaction
      const txHash = await signAndSendTransaction(
        api,
        transferExtrinsic,
        facilitatorPair,
        { nonce }
      );

      // Disconnect API
      await api.disconnect();

      return {
        success: true,
        transactionHash: txHash,
      };
    } catch (error) {
      await api.disconnect();
      throw error;
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Settlement failed',
    };
  }
}

