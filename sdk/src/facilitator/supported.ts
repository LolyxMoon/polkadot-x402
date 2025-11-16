/**
 * Supported networks and payment schemes
 */

import { getSupportedNetworks } from '../networks/config';
import type { SupportedPayment } from '../types';

/**
 * Get supported payment configurations
 */
export function getSupportedPayments(): SupportedPayment[] {
  const networks = getSupportedNetworks();
  
  return networks.map((network) => ({
    x402Version: 1,
    scheme: 'exact',
    network,
    extra: {},
  }));
}

/**
 * Check if a payment configuration is supported
 */
export function isPaymentSupported(
  x402Version: number,
  scheme: string,
  network: string
): boolean {
  if (x402Version !== 1) {
    return false;
  }

  if (scheme !== 'exact') {
    return false;
  }

  const supported = getSupportedPayments();
  return supported.some((p) => p.network === network);
}

