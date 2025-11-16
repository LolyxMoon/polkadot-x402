/**
 * Polkadot X402 SDK
 * Main package exports
 */

// Types
export type {
  PaymentRequirements,
  VerificationResult,
  SettlementResult,
  SupportedPayment,
  ErrorResponse,
  PaymentPayload,
  PolkadotSigner,
} from './types';

// Network configuration
export {
  getNetworkConfig,
  getSupportedNetworks,
  isNetworkSupported,
  getAllNetworks,
} from './networks/config';

export type { NetworkConfig, NetworkId } from './networks/types';

// Facilitator functions
export { verifyX402Payment } from './facilitator/verify';
export { settleX402Payment } from './facilitator/settle';
export {
  getSupportedPayments,
  isPaymentSupported,
} from './facilitator/supported';

// Client utilities
export { createSignerFromPrivateKey } from './client/signer';
export { createPaymentHeader } from './client/payment';

export type {
  CreatePaymentHeaderOptions,
  PaymentHeaderResult,
} from './client/types';

// Axios wrapper
export {
  createX402Axios,
  addX402Support,
} from './axios/wrapper';

export type {
  X402AxiosConfig,
} from './axios/wrapper';

export type {
  X402InterceptorConfig,
} from './axios/interceptor';

// Utilities (exported for advanced usage)
export {
  signMessage,
  verifySignature,
  createPaymentHash,
  encodePaymentPayload,
  decodePaymentPayload,
} from './utils/crypto';

export {
  createTransferExtrinsic,
  signAndSendTransaction,
  getAccountNonce,
  getAccountBalance,
} from './utils/substrate';

export {
  validatePaymentRequirements,
  validateVerifyRequest,
  validateSettleRequest,
} from './utils/validation';

