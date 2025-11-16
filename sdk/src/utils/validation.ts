/**
 * Validation utilities using Zod
 */

import { z } from 'zod';

/**
 * Payment requirements schema
 */
export const PaymentRequirementsSchema = z.object({
  x402Version: z.number().int().positive(),
  scheme: z.string().min(1),
  network: z.string().min(1),
  maxAmountRequired: z.string().optional(),
  resource: z.string().optional(),
  description: z.string().optional(),
  mimeType: z.string().optional(),
  payTo: z.string().optional(),
  maxTimeoutSeconds: z.number().int().positive().optional(),
  asset: z.string().optional(),
  extra: z.record(z.any()).optional(),
});

/**
 * Verify request schema
 */
export const VerifyRequestSchema = z.object({
  payload: z.string().min(1),
  details: PaymentRequirementsSchema,
});

/**
 * Settle request schema
 */
export const SettleRequestSchema = z.object({
  payload: z.string().min(1),
  details: PaymentRequirementsSchema,
});

/**
 * Validate payment requirements
 */
export function validatePaymentRequirements(
  requirements: unknown
): { valid: boolean; error?: string; data?: any } {
  try {
    const data = PaymentRequirementsSchema.parse(requirements);
    return { valid: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        error: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      };
    }
    return { valid: false, error: 'Invalid payment requirements' };
  }
}

/**
 * Validate verify request
 */
export function validateVerifyRequest(
  request: unknown
): { valid: boolean; error?: string; data?: any } {
  try {
    const data = VerifyRequestSchema.parse(request);
    return { valid: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        error: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      };
    }
    return { valid: false, error: 'Invalid verify request' };
  }
}

/**
 * Validate settle request
 */
export function validateSettleRequest(
  request: unknown
): { valid: boolean; error?: string; data?: any } {
  try {
    const data = SettleRequestSchema.parse(request);
    return { valid: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        error: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      };
    }
    return { valid: false, error: 'Invalid settle request' };
  }
}

