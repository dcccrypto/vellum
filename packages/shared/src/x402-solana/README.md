# 402-solana

A reusable, framework-agnostic implementation of the x402 payment protocol for Solana.

## Features

✅ **Client-side**: Automatic 402 payment handling with any wallet provider  
✅ **Server-side**: Payment verification and settlement with facilitator  
✅ **Framework agnostic**: Works with any wallet provider (Privy, Phantom, etc.)  
✅ **HTTP framework agnostic**: Works with Next.js, Express, Fastify, etc.  
✅ **TypeScript**: Full type safety with proper interfaces  
✅ **Web3.js**: Built on @solana/web3.js and @solana/spl-token

## Installation

This package is part of the `@vellum/shared` monorepo package:

```typescript
import { createX402Client, X402PaymentHandler } from '@vellum/shared';
```

## Usage

### Client Side (React/Frontend)

```typescript
import { createX402Client, usdToMicroUsdc } from '@vellum/shared';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';

function MyComponent() {
  const wallet = useWallet();
  
  // Create x402 client
  const client = createX402Client({
    wallet: {
      address: wallet.publicKey!.toBase58(),
      publicKey: wallet.publicKey,
      signTransaction: wallet.signTransaction!,
    },
    network: 'solana-devnet',
    maxPaymentAmount: BigInt(usdToMicroUsdc(10)), // Optional: max $10
  });

  // Make a paid request - automatically handles 402 payments
  const response = await client.fetch('/api/paid-endpoint', {
    method: 'POST',
    body: JSON.stringify({ data: 'your request' }),
  });

  const result = await response.json();
}
```

### Server Side (Express/Next.js)

```typescript
import { X402PaymentHandler } from '@vellum/shared';

const x402 = new X402PaymentHandler({
  network: 'solana-devnet',
  treasuryAddress: process.env.TREASURY_WALLET_ADDRESS!,
  facilitatorUrl: 'https://facilitator.payai.network',
});

export async function POST(req: Request) {
  // 1. Extract payment header
  const paymentHeader = x402.extractPayment(req.headers);
  
  if (!paymentHeader) {
    // Return 402 with payment requirements
    const response = await x402.create402Response({
      amount: 2_500_000,  // $2.50 USDC (in micro-units)
      description: 'AI Chat Request',
      resource: '/api/chat',
    });
    return Response.json(response.body, { status: response.status });
  }

  // 2. Create payment requirements (store this for verify/settle)
  const paymentRequirements = await x402.createPaymentRequirements({
    amount: 2_500_000,
    description: 'AI Chat Request',
    resource: '/api/chat',
  });

  // 3. Verify payment
  const verified = await x402.verifyPayment(paymentHeader, paymentRequirements);
  if (!verified) {
    return Response.json({ error: 'Invalid payment' }, { status: 402 });
  }

  // 4. Process your business logic
  const result = await yourBusinessLogic(req);

  // 5. Settle payment
  await x402.settlePayment(paymentHeader, paymentRequirements);

  // 6. Return response
  return Response.json(result);
}
```

## API Reference

### Client

#### `createX402Client(config)`

Creates a new x402 client instance.

**Config:**
```typescript
{
  wallet: WalletAdapter;              // Wallet with signTransaction method
  network: 'solana' | 'solana-devnet';
  rpcUrl?: string;                    // Optional custom RPC
  maxPaymentAmount?: bigint;          // Optional safety limit
}
```

**Methods:**
- `client.fetch(input, init)` - Make a fetch request with automatic payment handling

### Server

#### `new X402PaymentHandler(config)`

Creates a new payment handler instance.

**Config:**
```typescript
{
  network: 'solana' | 'solana-devnet';
  treasuryAddress: string;            // Where payments are sent
  facilitatorUrl: string;             // Facilitator service URL
  rpcUrl?: string;                    // Optional custom RPC
  usdcMint?: string;                  // Auto-detected if not provided
}
```

**Methods:**
- `extractPayment(headers)` - Extract X-PAYMENT header from request
- `createPaymentRequirements(options)` - Create payment requirements object
- `create402Response(options)` - Create 402 response body
- `verifyPayment(header, requirements)` - Verify payment with facilitator
- `settlePayment(header, requirements)` - Settle payment with facilitator

## Utility Functions

```typescript
import { usdToMicroUsdc, microUsdcToUsd, formatUSDC } from '@vellum/shared';

// Convert USD to USDC micro-units
const microUnits = usdToMicroUsdc(2.5);  // 2_500_000

// Convert micro-units to USD
const usd = microUsdcToUsd(2_500_000);   // 2.5

// Format for display
const formatted = formatUSDC(2_500_000); // "$2.5000"
```

## Payment Amounts

Payment amounts are in USDC micro-units (6 decimals):
- 1 USDC = 1,000,000 micro-units
- $0.01 = 10,000 micro-units
- $2.50 = 2,500,000 micro-units

## Architecture

```
src/x402-solana/
├── client/
│   └── index.ts              # Client-side x402 client
├── server/
│   └── index.ts              # Server-side payment handler
├── types/
│   └── index.ts              # TypeScript types & interfaces
├── utils/
│   └── index.ts              # Helper functions
└── index.ts                  # Main package export
```

