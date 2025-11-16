# polkadot-x402

X402 payment protocol implementation for Polkadot networks. This SDK provides facilitator functions, client utilities, and an axios wrapper for handling HTTP 402 Payment Required responses with automatic payment processing.

## Installation

```bash
npm install polkadot-x402
```

## Features

- ✅ Native Polkadot support (DOT, KSM, testnets)
- ✅ Automatic 402 payment handling with axios interceptor
- ✅ Payment verification and settlement
- ✅ Full TypeScript support
- ✅ Multiple network support (Polkadot, Kusama, Westend)

## Quick Start

### Using the Axios Wrapper (Recommended)

```typescript
import { createX402Axios, createSignerFromPrivateKey } from 'polkadot-x402';

// Create a signer from private key
const signer = createSignerFromPrivateKey('your-private-key', 'polkadot');

// Create axios instance with x402 support
const axiosInstance = createX402Axios({
  baseURL: 'https://api.example.com',
  x402: {
    signer,
    network: 'polkadot',
    onPaymentRequired: (requirements) => {
      console.log('Payment required:', requirements);
    },
    onPaymentSettled: (txHash) => {
      console.log('Payment settled:', txHash);
    },
  },
});

// Make requests - 402 responses are handled automatically
const response = await axiosInstance.get('/protected-resource');
```

### Manual Payment Creation

```typescript
import { createSignerFromPrivateKey, createPaymentHeader } from 'polkadot-x402';

const signer = createSignerFromPrivateKey('your-private-key', 'polkadot');

const paymentRequirements = {
  x402Version: 1,
  scheme: 'exact',
  network: 'polkadot',
  maxAmountRequired: '10000000000', // 0.01 DOT (10 decimals)
  payTo: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
  resource: '/api/protected-resource',
};

const paymentResult = await createPaymentHeader(signer, {
  from: signer.address,
  to: paymentRequirements.payTo!,
  amount: paymentRequirements.maxAmountRequired!,
  requirements: paymentRequirements,
});

// Use paymentResult.paymentHeader in X-402-Payment header
```

### Facilitator Functions

#### Verify Payment

```typescript
import { verifyX402Payment } from 'polkadot-x402';

const result = await verifyX402Payment(payload, requirements);

if (result.valid) {
  console.log('Payment verified:', result.details);
} else {
  console.error('Payment invalid:', result.error);
}
```

#### Settle Payment

```typescript
import { settleX402Payment } from 'polkadot-x402';

const result = await settleX402Payment(
  payload,
  requirements,
  facilitatorPrivateKey
);

if (result.success) {
  console.log('Transaction hash:', result.transactionHash);
} else {
  console.error('Settlement failed:', result.error);
}
```

## API Reference

### Network Configuration

```typescript
import { getNetworkConfig, getSupportedNetworks } from 'polkadot-x402';

// Get network configuration
const config = getNetworkConfig('polkadot');

// Get all supported networks
const networks = getSupportedNetworks(); // ['polkadot', 'kusama', 'westend', ...]
```

### Signer Creation

```typescript
import { createSignerFromPrivateKey } from 'polkadot-x402';

// Create signer from private key (hex or mnemonic)
const signer = createSignerFromPrivateKey('0x...', 'polkadot');
```

### Payment Header Creation

```typescript
import { createPaymentHeader } from 'polkadot-x402';

const result = await createPaymentHeader(signer, {
  from: signer.address,
  to: 'recipient-address',
  amount: '10000000000',
  requirements: paymentRequirements,
});
```

## Supported Networks

- **Polkadot** (`polkadot`) - Mainnet
- **Kusama** (`kusama`) - Canary network
- **Westend** (`westend`) - Testnet
- **Polkadot Testnet** (`polkadot-testnet`)

## Payment Flow

1. Client makes request to protected resource
2. Server responds with HTTP 402 and payment requirements
3. Axios interceptor detects 402 response
4. Client creates payment authorization using signer
5. Client retries request with `X-402-Payment` header
6. Server verifies payment and settles on-chain
7. Server returns protected resource with settlement transaction hash

## TypeScript Support

Full TypeScript definitions are included. All types are exported from the main package:

```typescript
import type {
  PaymentRequirements,
  VerificationResult,
  SettlementResult,
  PolkadotSigner,
} from 'polkadot-x402';
```

## License

MIT

