# Polkadot x402 Facilitator

A complete x402 payment facilitator implementation for **Polkadot Hub TestNet** (EVM-compatible). This Next.js application provides a production-ready facilitator service that enables HTTP 402 Payment Required for API monetization using native PAS token transfers.

## Overview

This project implements the [x402 payment protocol](https://x402.dev) for Polkadot Hub TestNet, allowing API providers to charge for access using blockchain micropayments. The facilitator handles payment verification, settlement, and provides middleware for automatic payment protection.
a
## Features

- ✅ **Complete x402 Facilitator**: Verification, settlement, and supported endpoints
- ✅ **EVM-Compatible**: Built for Polkadot Hub TestNet (EVM-compatible chain)
- ✅ **Native Token Support**: Direct PAS token transfers without ERC-20 contracts
- ✅ **Custom EIP-712 Signing**: Full control over payment authorization signing
- ✅ **Next.js Middleware**: Automatic payment protection for API routes
- ✅ **Production Ready**: Comprehensive error handling and logging
- ✅ **TypeScript**: Full type safety throughout

## Architecture

### Components

1. **Facilitator Endpoints** (`/api/facilitator/*`)
   - `/api/facilitator/verify` - Verifies payment authorizations using EIP-712 signature validation
   - `/api/facilitator/settle` - Settles payments by transferring native tokens from buyer to seller
   - `/api/facilitator/supported` - Returns supported payment networks and schemes

2. **Protected API Routes** (`/api/protected/*`)
   - Protected by x402 middleware
   - Example: `/api/protected/weather` - Returns weather data after payment verification

3. **Payment Middleware** (`middleware.ts`)
   - Intercepts requests to protected routes
   - Returns 402 Payment Required with payment requirements
   - Verifies and settles payments before allowing access

4. **Payment Creation** (`/api/demo/create-payment`)
   - Server-side payment authorization signing
   - Uses buyer's private key to create EIP-712 signatures
   - Returns base64-encoded payment header

## How It Works

### Payment Flow

1. **Client Request**: Client makes a request to a protected endpoint (e.g., `/api/protected/weather`)

2. **402 Response**: Middleware intercepts the request and returns HTTP 402 with payment requirements:
   ```json
   {
     "x402Version": 1,
     "scheme": "exact",
     "network": "polkadot-hub-testnet",
     "maxAmountRequired": "1000000000000000000",
     "payTo": "0x9A78BC1B83242189C9d456067F56FFEEfba4376c",
     "asset": "native",
     "resource": "/api/protected/weather"
   }
   ```

3. **Payment Authorization**: Client creates a payment authorization:
   - Calls `/api/demo/create-payment` with payment requirements
   - Server signs EIP-712 payment authorization using buyer's private key
   - Returns base64-encoded `X-402-Payment` header

4. **Retry with Payment**: Client retries the request with `X-402-Payment` header

5. **Verification**: Middleware calls `/api/facilitator/verify`:
   - Validates EIP-712 signature
   - Checks payment requirements match
   - Verifies timestamp hasn't expired

6. **Settlement**: If verification succeeds, middleware calls `/api/facilitator/settle`:
   - Transfers native PAS tokens from buyer to seller
   - Returns transaction hash

7. **Success Response**: Protected resource is returned with settlement transaction hash in headers

### Network Configuration

**Polkadot Hub TestNet** (EVM-compatible):
- **Network Name**: Polkadot Hub TestNet
- **Currency Symbol**: PAS
- **Chain ID**: 420420422
- **RPC URL**: `https://testnet-passet-hub-eth-rpc.polkadot.io`
- **Block Explorer**: `https://blockscout-passet-hub.parity-testnet.parity.io/`

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Polkadot Hub TestNet PAS tokens for testing

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd polkadot-x402

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Facilitator Configuration
FACILITATOR_PRIVATE_KEY=0x...
FACILITATOR_URL=http://localhost:3000/api/facilitator

# Buyer and Seller Wallets
BUYER_PRIVATE_KEY=0x...
SELLER_PRIVATE_KEY=0x...

# Token Configuration
TOKEN_ADDRESS=native
```

**Note**: Public addresses are computed automatically from private keys. The facilitator URL should point to your facilitator service base path.

### Development

```bash
# Start development server
npm run dev

# Run tests
npm run test:flow

# Check implementation
npm run check:impl
```

The application will be available at `http://localhost:3000`.

## API Endpoints

### Facilitator Endpoints

#### `POST /api/facilitator/verify`

Verifies a payment authorization.

**Request:**
```json
{
  "payload": "base64-encoded-payment-header",
  "details": {
    "network": "polkadot-hub-testnet",
    "scheme": "exact",
    "maxAmountRequired": "1000000000000000000",
    "payTo": "0x...",
    "asset": "native"
  }
}
```

**Response:**
```json
{
  "valid": true,
  "details": {
    "amount": "1000000000000000000",
    "from": "0x...",
    "to": "0x...",
    "nonce": "0x...",
    "timestamp": 1234567890
  }
}
```

#### `POST /api/facilitator/settle`

Settles a verified payment by transferring tokens.

**Request:**
```json
{
  "payload": "base64-encoded-payment-header",
  "details": {
    "network": "polkadot-hub-testnet",
    "scheme": "exact",
    "maxAmountRequired": "1000000000000000000",
    "payTo": "0x...",
    "asset": "native"
  }
}
```

**Response:**
```json
{
  "success": true,
  "transactionHash": "0x..."
}
```

#### `GET /api/facilitator/supported`

Returns supported payment networks and schemes.

**Response:**
```json
{
  "networks": ["polkadot-hub-testnet"],
  "schemes": ["exact"],
  "assets": ["native"]
}
```

### Protected Endpoints

#### `GET /api/protected/weather`

Protected weather API endpoint. Requires x402 payment.

**Response (with valid payment):**
```json
{
  "city": "Buenos Aires",
  "temperature": 22,
  "condition": "Partly Cloudy",
  "humidity": 65,
  "windSpeed": 15
}
```

**Response Headers:**
- `X-Settlement-Tx`: Transaction hash of the payment settlement
- `X-Payment-Amount`: Amount paid

### Demo Endpoints

#### `POST /api/demo/create-payment`

Creates a payment authorization (server-side signing).

**Request:**
```json
{
  "paymentRequirements": {
    "network": "polkadot-hub-testnet",
    "scheme": "exact",
    "maxAmountRequired": "1000000000000000000",
    "payTo": "0x...",
    "asset": "native",
    "resource": "/api/protected/weather"
  }
}
```

**Response:**
```json
{
  "paymentHeader": "base64-encoded-payment-header",
  "network": "polkadot-hub-testnet",
  "address": "0x..."
}
```

## Project Structure

```
polkadot-x402/
├── app/
│   ├── api/
│   │   ├── facilitator/      # Facilitator endpoints
│   │   │   ├── verify/
│   │   │   ├── settle/
│   │   │   └── supported/
│   │   ├── protected/         # Protected API routes
│   │   │   └── weather/
│   │   └── demo/              # Demo endpoints
│   │       └── create-payment/
│   ├── demo/                  # Demo page
│   └── page.tsx               # Home page
├── lib/
│   ├── evm/                   # EVM utilities
│   │   ├── networks.ts        # Network configuration
│   │   └── wallet.ts          # Wallet management
│   └── x402/                  # x402 protocol logic
│       ├── sign.ts            # Payment signing
│       ├── verify.ts          # Payment verification
│       └── settle.ts          # Payment settlement
├── middleware.ts              # Next.js payment middleware
├── types/
│   └── x402.ts                # TypeScript types
└── sdk/                       # NPM package (separate)
```

## Testing

### End-to-End Test

Run the automated test script to verify the complete payment flow:

```bash
npm run test:flow
```

This script:
1. Makes a request to a protected endpoint
2. Receives 402 Payment Required
3. Creates payment authorization
4. Retries with payment header
5. Verifies successful settlement and response

### Manual Testing

1. Visit `http://localhost:3000/demo`
2. Click "Request Weather Data"
3. Watch the payment flow execute automatically

## Deployment

### Environment Variables

Ensure all required environment variables are set in your production environment:

- `FACILITATOR_PRIVATE_KEY` - Facilitator wallet private key
- `BUYER_PRIVATE_KEY` - Buyer wallet private key (for demo)
- `SELLER_PRIVATE_KEY` - Seller wallet private key
- `FACILITATOR_URL` - Public URL of your facilitator service
- `TOKEN_ADDRESS` - Token address (use `native` for native tokens)

### Production Checklist

- [ ] All environment variables configured
- [ ] Facilitator wallet has sufficient balance for gas
- [ ] Facilitator URL is publicly accessible
- [ ] Protected routes are correctly configured
- [ ] Error logging is properly configured
- [ ] Rate limiting is implemented (recommended)

## How It Differs from Coinbase x402 SDK

This implementation provides:

1. **Custom Network Support**: Full support for Polkadot Hub TestNet without SDK limitations
2. **Native Token Transfers**: Direct native token settlement without ERC-20 contracts
3. **Custom EIP-712 Signing**: Complete control over payment authorization format
4. **Server-Side Signing**: Secure payment creation using environment variables
5. **EVM-Compatible**: Built specifically for EVM-compatible Polkadot chains

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Support

For questions or issues, please open an issue on GitHub.
