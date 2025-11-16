/**
 * Client-side type definitions
 */

import type { PaymentRequirements } from '../types';

/**
 * Payment header creation options
 */
export interface CreatePaymentHeaderOptions {
  from: string;
  to: string;
  amount: string;
  requirements: PaymentRequirements;
  nonce?: string;
  timestamp?: number;
}

/**
 * Payment header result
 */
export interface PaymentHeaderResult {
  paymentHeader: string;
  payload: string;
  signature: string;
}

