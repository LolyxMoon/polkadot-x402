/**
 * Client-side environment variable access
 * Only variables prefixed with NEXT_PUBLIC_ are accessible on the client side
 */

export const clientEnv = {
  // Facilitator URL (for client-side API calls if needed)
  FACILITATOR_URL: process.env.NEXT_PUBLIC_FACILITATOR_URL || '',
  
  // Network is hardcoded
  NETWORK: 'polkadot-hub-testnet' as const,
};

