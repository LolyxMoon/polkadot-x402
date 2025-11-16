/**
 * Custom EIP-712 signing for x402 payment authorization
 * Signs payment requirements using EIP-712 typed data
 */

import { ethers } from 'ethers';
import { getBuyerWallet } from '@/lib/evm/wallet';
import { getNetworkConfig } from '@/lib/evm/networks';
import type { PaymentRequirements } from '@/types/x402';

/**
 * Sign payment authorization using EIP-712
 * Returns base64-encoded JSON with the signed payment
 */
export async function signPaymentAuthorization(
  paymentRequirements: PaymentRequirements,
  network?: string
): Promise<string> {
  const networkId = network || paymentRequirements.network;
  const networkConfig = getNetworkConfig(networkId);
  const buyerWallet = getBuyerWallet(networkId);
  const buyerAddress = await buyerWallet.getAddress();

  // Generate nonce and timestamp
  const nonce = ethers.randomBytes(32);
  const timestamp = Math.floor(Date.now() / 1000);

  // Extract payment details
  const payTo = paymentRequirements.payTo || '';
  const amount = paymentRequirements.maxAmountRequired || '0';
  const resource = paymentRequirements.resource || '';
  const asset = paymentRequirements.asset === 'native' 
    ? '0x0000000000000000000000000000000000000000' 
    : (paymentRequirements.asset || '0x0000000000000000000000000000000000000000');

  // EIP-712 domain
  const domain = {
    name: 'X402',
    version: '1',
    chainId: networkConfig.chainId,
    verifyingContract: asset, // Token address (zero address for native)
  };

  // EIP-712 types
  const types = {
    PaymentAuthorization: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'nonce', type: 'bytes32' },
      { name: 'timestamp', type: 'uint256' },
      { name: 'resource', type: 'string' },
      { name: 'network', type: 'string' },
    ],
  };

  // EIP-712 message
  const message = {
    from: buyerAddress,
    to: payTo,
    amount: BigInt(amount).toString(),
    nonce: ethers.hexlify(nonce),
    timestamp: timestamp,
    resource: resource,
    network: networkId,
  };

  // Sign using EIP-712
  const signature = await buyerWallet.signTypedData(domain, types, message);

  // Create payment payload
  const paymentPayload = {
    x402Version: paymentRequirements.x402Version || 1,
    scheme: paymentRequirements.scheme || 'exact',
    network: networkId,
    payload: {
      signature: signature,
      authorization: {
        from: buyerAddress,
        to: payTo,
        amount: amount,
        nonce: ethers.hexlify(nonce),
        timestamp: timestamp,
        resource: resource,
        network: networkId,
        asset: asset,
      },
    },
    maxAmountRequired: amount,
    resource: resource,
    description: paymentRequirements.description || '',
    mimeType: paymentRequirements.mimeType || 'application/json',
    payTo: payTo,
    maxTimeoutSeconds: paymentRequirements.maxTimeoutSeconds || 300,
    asset: asset,
    extra: {
      ...paymentRequirements.extra,
      isNative: paymentRequirements.asset === 'native',
    },
  };

  // Encode as base64 JSON
  const jsonString = JSON.stringify(paymentPayload);
  const encoded = Buffer.from(jsonString).toString('base64');

  return encoded;
}

