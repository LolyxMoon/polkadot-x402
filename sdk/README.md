# polkadot-x402

X402 payment protocol implementation for **Polkadot Hub TestNet** (EVM-compatible). This SDK provides facilitator functions, client utilities, and an axios wrapper for handling HTTP 402 Payment Required responses with automatic payment processing.

## Installation

```bash
npm install polkadot-x402
```

## Features

- ✅ **Polkadot Hub TestNet Support** - EVM-compatible chain with native PAS token
- ✅ **Automatic 402 Payment Handling** - Axios interceptor for seamless payment processing
- ✅ **Payment Verification** - EIP-712 signature validation
- ✅ **Payment Settlement** - Native token transfers from buyer to seller
- ✅ **Full TypeScript Support** - Complete type definitions included
- ✅ **Server-Side Signing** - Secure payment authorization creation

## Quick Start

### Using the Axios Wrapper (Recommended)

```typescript
import { createX402Axios, createSignerFromPrivateKey } from 'polkadot-x402';

// Create a signer from private key
const signer = createSignerFromPrivateKey('your-private-key', 'polkadot-hub-testnet');

// Create axios instance with x402 support
const axiosInstance = createX402Axios({
  baseURL: 'https://api.example.com',
  x402: {
    signer,
    network: 'polkadot-hub-testnet',
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

const signer = createSignerFromPrivateKey('your-private-key', 'polkadot-hub-testnet');

const paymentRequirements = {
  x402Version: 1,
  scheme: 'exact',
  network: 'polkadot-hub-testnet',
  maxAmountRequired: '1000000000000000000', // 1 PAS (18 decimals)
  payTo: '0x9A78BC1B83242189C9d456067F56FFEEfba4376c',
  resource: '/api/protected-resource',
  asset: 'native',
};

const paymentResult = await createPaymentHeader(signer, {
  from: signer.address,
  to: paymentRequirements.payTo!,
  amount: paymentRequirements.maxAmountRequired!,
  requirements: paymentRequirements,
});

// Use paymentResult.paymentHeader in X-402-Payment header
const response = await fetch('https://api.example.com/protected-resource', {
  headers: {
    'X-402-Payment': paymentResult.paymentHeader,
  },
});
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

## Network Configuration

### Polkadot Hub TestNet

- **Network Name**: Polkadot Hub TestNet
- **Currency Symbol**: PAS
- **Chain ID**: 420420422
- **RPC URL**: `https://testnet-passet-hub-eth-rpc.polkadot.io`
- **Block Explorer**: `https://blockscout-passet-hub.parity-testnet.parity.io/`

```typescript
import { getNetworkConfig } from 'polkadot-x402';

const config = getNetworkConfig('polkadot-hub-testnet');
console.log(config.chainId); // 420420422
```

## Payment Flow

1. **Client Request**: Client makes request to protected resource
2. **402 Response**: Server responds with HTTP 402 and payment requirements
3. **Payment Authorization**: Client creates EIP-712 signed payment authorization
4. **Retry with Payment**: Client retries request with `X-402-Payment` header
5. **Verification**: Server verifies payment signature and requirements
6. **Settlement**: Server settles payment by transferring tokens on-chain
7. **Success**: Protected resource is returned with transaction hash

## API Reference

### Types

```typescript
import type {
  PaymentRequirements,
  VerificationResult,
  SettlementResult,
  PolkadotSigner,
} from 'polkadot-x402';
```

### Network Configuration

```typescript
import { getNetworkConfig, getSupportedNetworks } from 'polkadot-x402';

// Get network configuration
const config = getNetworkConfig('polkadot-hub-testnet');

// Get all supported networks
const networks = getSupportedNetworks(); // ['polkadot-hub-testnet']
```

### Signer Creation

```typescript
import { createSignerFromPrivateKey } from 'polkadot-x402';

// Create signer from private key (hex format)
const signer = createSignerFromPrivateKey('0x...', 'polkadot-hub-testnet');
```

### Payment Header Creation

```typescript
import { createPaymentHeader } from 'polkadot-x402';

const result = await createPaymentHeader(signer, {
  from: signer.address,
  to: 'recipient-address',
  amount: '1000000000000000000',
  requirements: paymentRequirements,
});
```

## Supported Networks

Currently supports:
- **Polkadot Hub TestNet** (`polkadot-hub-testnet`) - EVM-compatible testnet

## Native Token Support

This SDK supports native PAS token transfers on Polkadot Hub TestNet. Set `asset: 'native'` in payment requirements to use native tokens instead of ERC-20 tokens.

## TypeScript Support

Full TypeScript definitions are included. All types are exported from the main package:

```typescript
import type {
  PaymentRequirements,
  VerificationResult,
  SettlementResult,
  PolkadotSigner,
  NetworkConfig,
  NetworkId,
} from 'polkadot-x402';
```

## Differences from Coinbase x402 SDK

This SDK is specifically designed for Polkadot Hub TestNet and provides:

1. **Custom Network Support**: Full support for Polkadot Hub TestNet without SDK limitations
2. **Native Token Transfers**: Direct native token settlement without ERC-20 contracts
3. **EVM-Compatible**: Built specifically for EVM-compatible Polkadot chains
4. **Custom EIP-712 Signing**: Complete control over payment authorization format

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Support

For questions or issues, please open an issue on GitHub.
