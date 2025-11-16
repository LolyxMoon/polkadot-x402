/**
 * Client-side environment variable access
 * Only variables prefixed with NEXT_PUBLIC_ are accessible on the client side
 */

export const clientEnv = {
  // Facilitator URL (for client-side API calls if needed)
  FACILITATOR_URL: process.env.NEXT_PUBLIC_FACILITATOR_URL || '',
  
  // Token address (for client-side display/config if needed)
  TOKEN_ADDRESS: process.env.NEXT_PUBLIC_TOKEN_ADDRESS || 'native',
  
  // Network is hardcoded
  NETWORK: 'polkadot-hub-testnet' as const,
};

