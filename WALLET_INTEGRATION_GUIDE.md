# Vellum Wallet Integration Guide

## Overview

The Vellum frontend now includes **full Solana wallet integration** with **x402 payment processing**. Users can connect their wallets (Phantom, Solflare, Torus, Ledger) and actually pay for micro-utility services using USDC-SPL on Solana.

## Features

### ✅ What's Implemented

1. **Multi-Wallet Support**
   - Phantom
   - Solflare
   - Torus
   - Ledger
   - Auto-connect on return visits

2. **Complete x402 Payment Flow**
   - Initial request → HTTP 402 response
   - Automatic USDC balance checking
   - Transaction signing with user's wallet
   - Payment verification and settlement
   - Service fulfillment with result display

3. **User Experience Enhancements**
   - Real-time payment status updates
   - Balance validation before payment
   - Clear error messages with actionable guidance
   - Animated UI feedback for all states
   - Cached results (no double payment)
   - Direct links to devnet USDC faucet

4. **Developer Experience**
   - Fully typed with TypeScript
   - Reusable payment utility functions
   - Environment-based configuration
   - Custom styled wallet UI matching Vellum theme

## Architecture

### Key Components

```
apps/web/
├── src/
│   ├── components/
│   │   └── WalletProvider.tsx       # Solana wallet adapter context
│   ├── lib/
│   │   └── x402-payment.ts          # Payment flow utilities
│   └── app/
│       ├── layout.tsx               # Wraps app with WalletProvider
│       └── tools/[sku]/page.tsx     # Individual tool with payment
```

### Payment Flow Diagram

```
┌─────────────────────┐
│  User Fills Form    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Check Wallet       │ ← Validates connection
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Check USDC Balance │ ← Ensures sufficient funds
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  POST to API        │ → Receives HTTP 402
│  (no X-PAYMENT)     │   with paymentRequirements
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Create TX          │
│  User Signs in      │ ← Wallet prompt
│  Phantom/Solflare   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Retry POST with    │
│  X-PAYMENT header   │ → PayAI verifies & settles
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  HTTP 200 Success   │
│  Result + URL       │ ← Display to user
└─────────────────────┘
```

## Configuration

### Environment Variables

Create or update `/apps/web/.env`:

```bash
# API endpoint
NEXT_PUBLIC_API_URL=http://localhost:3001

# Solana configuration (devnet for testing)
NEXT_PUBLIC_SOLANA_CLUSTER=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_USDC_MINT_ADDRESS=4zMMC9srt5Ri5X14GAgXhaHiiM2E3YVsDBgf4GyhBTWK

# For mainnet (production):
# NEXT_PUBLIC_SOLANA_CLUSTER=mainnet-beta
# NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
# NEXT_PUBLIC_USDC_MINT_ADDRESS=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
```

### Important Notes

- **Devnet USDC**: Users testing on devnet need devnet USDC. Direct them to: https://spl-token-faucet.com/?token-name=USDC-Dev
- **RPC URL**: For production, use a paid RPC provider (QuickNode, Helius, Alchemy) for better reliability
- **Transaction Fees**: Users pay ~0.000005 SOL per transaction (ensure they have some SOL for fees)

## Usage Guide

### For End Users

1. **Navigate to a Tool**
   - Go to `/tools` and select any micro-utility
   - Example: `/tools/img-gen-basic`

2. **Connect Wallet**
   - Click "Connect Wallet" button (top right)
   - Select your wallet (Phantom, Solflare, etc.)
   - Approve the connection in your wallet extension

3. **Configure Service**
   - Fill in the required fields
   - Example: Enter a text prompt for image generation

4. **Pay & Submit**
   - Click "Pay $0.03 & Get Result" (or respective price)
   - System checks your USDC balance
   - Wallet prompts you to sign the USDC transfer transaction
   - Approve the transaction

5. **Receive Result**
   - Service is fulfilled instantly
   - Result displays with download link
   - Signed URL valid for 1 hour

### For Developers

#### Using the Payment Utility

```typescript
import { makeX402Request, formatUSDC, checkUSDCBalance } from '@/lib/x402-payment';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';

// In your component
const wallet = useWallet();
const { connection } = useConnection();

// Check balance before payment
const balance = await checkUSDCBalance(wallet, connection, '30000');
console.log(`Has enough: ${balance.hasEnough}`);
console.log(`Balance: ${formatUSDC(balance.balance.toString())}`);

// Make payment request
const result = await makeX402Request(
  'http://localhost:3001',  // API URL
  'img-gen-basic',          // SKU ID
  { prompt: 'A sunset' },   // Input data
  wallet,                    // Wallet instance
  connection                 // RPC connection
);

console.log('Paid:', result.paid);
console.log('Result:', result.data);
```

#### Custom Wallet UI

The wallet adapter UI is styled to match Vellum's theme. Customize in `apps/web/src/app/globals.css`:

```css
.wallet-adapter-button {
  @apply font-semibold transition-all;
}

.wallet-adapter-modal {
  @apply bg-background border border-border rounded-lg shadow-2xl;
}
```

## Testing

### Local Testing Setup

1. **Start API Server**
   ```bash
   cd apps/api
   pnpm dev
   ```

2. **Start Web Server**
   ```bash
   cd apps/web
   pnpm dev
   ```

3. **Get Test USDC**
   - Install Phantom wallet (or Solflare)
   - Switch to Devnet in wallet settings
   - Visit https://spl-token-faucet.com/?token-name=USDC-Dev
   - Airdrop devnet USDC to your wallet

4. **Test Payment Flow**
   - Go to http://localhost:3000/tools/img-gen-basic
   - Connect your wallet
   - Enter a prompt
   - Submit and approve the transaction
   - Verify result is displayed

### Test Cases

✅ **Happy Path**
- User connects wallet
- Has sufficient USDC
- Submits valid input
- Approves transaction
- Receives result

✅ **Insufficient Balance**
- User connects wallet
- Balance < required
- Error shown with faucet link
- No transaction attempted

✅ **Wallet Not Connected**
- User tries to submit without wallet
- Clear prompt to connect
- Submit button disabled

✅ **Cached Result (Idempotency)**
- User pays for a service
- Same input is requested again
- Cached result returned instantly
- No second payment charged

✅ **User Rejects Transaction**
- User rejects in wallet popup
- Error shown gracefully
- Can retry

## Troubleshooting

### Common Issues

**"Wallet not connected"**
- Ensure you clicked "Connect Wallet" and approved in extension
- Check if wallet extension is installed and unlocked

**"Insufficient USDC"**
- Visit devnet faucet: https://spl-token-faucet.com/?token-name=USDC-Dev
- For mainnet: Buy USDC on an exchange and transfer to wallet

**"Transaction failed"**
- Ensure you have SOL for transaction fees (~0.000005 SOL)
- Check RPC connection (try switching RPC in wallet settings)
- Verify you're on the correct network (devnet vs mainnet)

**"Module not found" errors**
- Run `pnpm install` in project root
- Restart dev server

**Native binding warnings (gyp errors)**
- These are safe to ignore - pure JS implementations are used as fallback
- No impact on functionality

## Security Considerations

### Client-Side

- ✅ Wallet private keys never leave the browser
- ✅ Transactions are signed locally in wallet extension
- ✅ No sensitive keys in frontend code or env vars
- ✅ Only `NEXT_PUBLIC_*` variables exposed to client

### Transaction Safety

- ✅ Exact amount verification before signing
- ✅ Recipient address validated
- ✅ Transaction simulation before sending (wallet feature)
- ✅ Idempotency prevents double charges

### Best Practices

1. **Never share private keys**
2. **Verify recipient address** matches your API's vault address
3. **Start on devnet** for testing
4. **Use dedicated wallet** for development
5. **Implement rate limiting** on API to prevent abuse

## Production Deployment

### Pre-Launch Checklist

- [ ] Switch to mainnet in `.env`
  - `NEXT_PUBLIC_SOLANA_CLUSTER=mainnet-beta`
  - `NEXT_PUBLIC_USDC_MINT_ADDRESS=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`

- [ ] Use production RPC URL (QuickNode/Helius/Alchemy)

- [ ] Update API URL to production endpoint
  - `NEXT_PUBLIC_API_URL=https://api.yourdomain.com`

- [ ] Test with real USDC on mainnet (small amounts)

- [ ] Verify PayAI facilitator is configured for mainnet

- [ ] Enable transaction monitoring/logging

- [ ] Add error tracking (Sentry, etc.)

### Recommended RPC Providers

- **QuickNode**: https://www.quicknode.com/
- **Helius**: https://www.helius.dev/
- **Alchemy**: https://www.alchemy.com/solana
- **Triton**: https://triton.one/

## Advanced Customization

### Adding More Wallets

Edit `apps/web/src/components/WalletProvider.tsx`:

```typescript
import { SlopeWalletAdapter } from '@solana/wallet-adapter-slope';

const wallets = useMemo(
  () => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new SlopeWalletAdapter(),  // Add new wallet
    // ... more
  ],
  []
);
```

### Custom Payment Logic

Extend `apps/web/src/lib/x402-payment.ts` for custom requirements:

```typescript
export async function makeX402RequestWithRetry(
  apiUrl: string,
  sku: string,
  input: Record<string, any>,
  wallet: any,
  connection: Connection,
  maxRetries = 3
): Promise<any> {
  let attempts = 0;
  while (attempts < maxRetries) {
    try {
      return await makeX402Request(apiUrl, sku, input, wallet, connection);
    } catch (error) {
      attempts++;
      if (attempts >= maxRetries) throw error;
      await new Promise(r => setTimeout(r, 1000 * attempts));
    }
  }
}
```

## API Reference

### `makeX402Request()`

Makes a paid request using the x402 protocol.

**Parameters:**
- `apiUrl`: string - Base URL of the Vellum API
- `sku`: string - Service SKU ID (e.g., 'img-gen-basic')
- `input`: Record<string, any> - Service-specific input data
- `wallet`: WalletContextState - Solana wallet adapter instance
- `connection`: Connection - Solana RPC connection

**Returns:** Promise<{ status: number, data: any, paid: boolean, cached: boolean }>

**Throws:** Error if payment fails or service unavailable

### `checkUSDCBalance()`

Checks if wallet has sufficient USDC for a transaction.

**Parameters:**
- `wallet`: WalletContextState
- `connection`: Connection
- `requiredAtomic`: string - Required amount in atomic units

**Returns:** Promise<{ hasEnough: boolean, balance: bigint, required: bigint }>

### `formatUSDC()`

Formats atomic USDC units to USD string.

**Parameters:**
- `amountAtomic`: string - Amount in atomic units (6 decimals)

**Returns:** string - Formatted USD amount (e.g., "$0.0300")

## Support & Resources

- **Solana Wallet Adapter Docs**: https://github.com/anza-xyz/wallet-adapter
- **Solana Web3.js**: https://solana-labs.github.io/solana-web3.js/
- **x402 Protocol**: (Internal spec in `packages/shared/src/x402.ts`)
- **PayAI Facilitator**: https://facilitator.payai.network

## Contributing

Found a bug or have a feature request? Please open an issue on the project repository.

---

**Built with ❤️ using Solana, Next.js, and x402**

