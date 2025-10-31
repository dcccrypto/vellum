# Vellum

**Micro-utility store powered by x402 payments on Solana**

**Website**: [vellumlabs.app](https://vellumlabs.app) · **X**: [@VellumLabsAi](https://x.com/VellumLabsAi)

Vellum is a production-ready monorepo that demonstrates how to build paid micro-services using the x402 protocol with PayAI facilitator on Solana (USDC-SPL). Each service is accessed through a single HTTP endpoint that returns 402 Payment Required, then verifies and settles payment before fulfilling the order.

> Contributing? See [CONTRIBUTING.md](./CONTRIBUTING.md) for a quick add-a-service guide.

## Features

### Core API
- **Single payment endpoint**: `POST /x402/pay?sku=<id>`
- **HTTP 402 payments**: Standard x402 protocol with PayAI facilitator
- **Solana USDC**: Payments in USDC (SPL) on Solana devnet/mainnet
- **7 micro-utilities**: Image generation, meme maker, background removal, upscaling, favicon generator, URL summarizer, PDF-to-text
- **Supabase Storage**: Results delivered via signed URLs (1hr TTL)
- **Idempotency**: Safe retries using transaction signatures

### Frontend (NEW! 🎉)
- **Multi-Wallet Support**: Connect with Phantom, Solflare, Torus, or Ledger
- **Live Payments**: Users can actually pay and receive services directly from the UI
- **Balance Checking**: Automatic USDC balance validation before transactions
- **Full x402 Flow**: Complete HTTP 402 → payment → fulfillment cycle
- **Premium UX**: Next.js 15 with Inspira UI, animated gradients, and responsive design
- **Real-time Feedback**: Live payment status updates and error handling

> 🚀 **Try it live**: Visit `/tools` to connect your wallet and test any service with real devnet USDC!

## Architecture

```
/apps
  /api               # Express server with single /x402/pay route
  /web               # Next.js 15 marketing site with Inspira UI
/packages
  /shared            # Shared utilities (env, x402, payai, supabase, etc.)
/scripts
  preflight.ts       # Config validator and ATA derivation
/tests
  http.curl.md       # HTTP test harness
  units.test.ts      # Unit tests for price conversions
```

## Quick Start

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
cp apps/web/.env.example apps/web/.env
```

Required values:
- `VAULT_OWNER`: Your Solana public key (receives payments)
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`: Supabase project credentials
- `NEXT_PUBLIC_API_URL`: API endpoint (default: http://localhost:3001)
- `NEXT_PUBLIC_SOLANA_CLUSTER`: devnet or mainnet-beta
- `NEXT_PUBLIC_USDC_MINT_ADDRESS`: USDC token mint address
- `GEMINI_API_KEY`: Google Gemini API key for image generation

### 3. Run preflight check

```bash
pnpm preflight
```

This will:
- Validate environment configuration
- Derive USDC Associated Token Account
- Display SKU catalog with prices
- Check facilitator connectivity

### 4. Start development servers

```bash
# Terminal 1: API server
cd apps/api
pnpm dev

# Terminal 2: Web app
cd apps/web
pnpm dev
```

API runs on http://localhost:3001  
Web runs on http://localhost:3000

## SKU Catalog

| SKU | Price | Description |
|-----|-------|-------------|
| `img-gen-basic` | $0.03 | Generate 768×768 PNG from text prompt (Gemini) |
| `meme-maker` | $0.03 | Create memes with templates or custom images |
| `bg-remove` | $0.06 | Remove background from image (PNG with alpha) |
| `upscale-2x` | $0.05 | Upscale image 2× with quality enhancement |
| `favicon` | $0.03 | Generate multi-size favicons (16-512px + ICO) |
| `urlsum` | $0.03 | Extract and summarize webpage content |
| `pdf2txt` | $0.04 | Extract text from PDF (≤10MB) |

## x402 Flow

1. **Offer**: Client sends POST request, receives HTTP 402 with payment requirements
2. **Pay**: Client signs Solana transaction, retries with `X-PAYMENT` header
3. **Verify**: Server calls PayAI `/verify` endpoint
4. **Settle**: Server calls PayAI `/settle` endpoint
5. **Fulfill**: Server processes SKU and returns result with `X-PAYMENT-RESPONSE` header

## Testing

### Wallet Integration Testing

**Test with Real Payments on Devnet:**

1. Install a Solana wallet (Phantom recommended)
2. Switch wallet to **Devnet** in settings
3. Get devnet USDC from faucet: https://spl-token-faucet.com/?token-name=USDC-Dev
4. Visit http://localhost:3000/tools
5. Click "Connect Wallet" and select your wallet
6. Choose any tool (e.g., Image Generation)
7. Fill in inputs and click "Pay & Get Result"
8. Approve transaction in wallet popup
9. View your result instantly!

**What to Test:**
- ✅ Wallet connection/disconnection
- ✅ Balance checking (sufficient vs insufficient funds)
- ✅ Transaction signing and submission
- ✅ Result display with download links
- ✅ Idempotency (same request returns cached result)
- ✅ Error handling (rejected transaction, network issues)

See **[WALLET_INTEGRATION_GUIDE.md](./WALLET_INTEGRATION_GUIDE.md)** for comprehensive testing guide.

### Manual HTTP tests (API only)

See `tests/http.curl.md` for curl commands that test each SKU:

```bash
# Should return 402
curl -i -X POST "http://localhost:3001/x402/pay?sku=img-gen-basic" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"A sunset over mountains"}'
```

### Unit tests

```bash
cd tests
pnpm test
```

## Deployment

### API Server

Requires Node 20+ runtime (not edge) due to `sharp` dependency.

**Environment variables**: Copy all from `.env.example`

**Recommended platforms**:
- Railway
- Render
- Fly.io
- Digital Ocean App Platform

### Web App

Standard Next.js 15 deployment:

```bash
cd apps/web
pnpm build
pnpm start
```

**Recommended platforms**:
- Vercel
- Netlify
- Cloudflare Pages

## Project Structure

```
vellum/
├── apps/
│   ├── api/                 # Express API server
│   │   └── src/
│   │       ├── fulfillment/ # SKU handlers (one per service)
│   │       ├── routes/      # x402 route handler
│   │       └── index.ts     # Server entry point
│   └── web/                 # Next.js frontend
│       └── src/
│           ├── app/         # App router pages
│           └── components/  # React components (Inspira UI)
├── packages/
│   └── shared/              # Shared TypeScript packages
│       └── src/
│           ├── env.ts       # Zod environment validation
│           ├── x402.ts      # Payment requirements builder
│           ├── payai.ts     # PayAI verify/settle client
│           ├── supabase.ts  # Storage client
│           ├── units.ts     # USDC atomic helpers
│           ├── validators.ts # Input validation
│           └── catalog.ts   # SKU definitions
├── scripts/
│   └── preflight.ts         # Preflight checker
└── tests/
    ├── http.curl.md         # HTTP test harness
    └── units.test.ts        # Unit tests
```

## Key Invariants

⚠️ **DO NOT MODIFY** these critical sections:

1. **`buildPaymentRequirements()` in `packages/shared/src/x402.ts`**
   - Must return identical object for 402 response AND PayAI calls
   - Marked with `=== LOCKED ===` comments

2. **CORS headers**
   - Always include `Access-Control-Allow-Origin: *`
   - Always expose `X-PAYMENT-RESPONSE` header

3. **Atomic USDC units**
   - All prices stored as strings with 6 decimals
   - Use bigint for all calculations

4. **Idempotency**
   - Cache results by transaction signature
   - Never fulfill same tx twice

## Tech Stack

- **API**: Node 20, Express, TypeScript
- **Frontend**: Next.js 15, React 18, Tailwind CSS, Framer Motion
- **Payments**: x402 protocol, PayAI facilitator, Solana USDC (SPL)
- **Storage**: Supabase Storage with signed URLs
- **AI**: Google Gemini (image generation)
- **Image Processing**: sharp, to-ico
- **PDF/HTML**: pdf-parse, readability, linkedom

## Resources

- [x402 Documentation](https://docs.cdp.coinbase.com/x402/welcome)
- [PayAI Facilitator](https://docs.payai.network)
- [Solana Documentation](https://solana.com/docs)
- [Supabase Storage](https://supabase.com/docs/guides/storage)

## License

MIT

