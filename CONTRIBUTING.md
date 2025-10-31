# Contributing to Vellum

Thanks for helping improve Vellum! This guide is short and practical so you can add new services quickly.

## Local dev

1. Install deps: `pnpm install`
2. Copy envs:
   - `cp .env.example .env`
   - `cp apps/web/.env.example apps/web/.env`
3. Preflight check: `pnpm preflight`
4. Run dev:
   - API: `pnpm dev:api`
   - Web: `pnpm dev:web`

## Add a new service (SKU) in 5 steps

1) Define the SKU in `packages/shared/src/catalog.ts`
   - Add an entry to the object returned by `getSkuCatalog()` with:
     - `id`, `name`, `description`
     - `priceAtomic` (add a corresponding `PRICE_*` env in `.env`)
     - `inputSchema` (Zod) and a simple `outputSchema` shape

2) Create the fulfillment handler in `apps/api/src/fulfillment/<your-sku>.ts`
   - Export `async function fulfillYourSku(input, txSig)` that returns an object matching `outputSchema`.
   - Put any long-running work here (AI calls, image ops, etc.).

3) Wire the SKU in `apps/api/src/fulfillment/index.ts`
   - Add a `case '<your-sku>': return fulfillYourSku(input, txSig);`

4) Expose the SKU in the UI
   - Add a card to `apps/web/src/components/ProductGrid.tsx` with `id`, `name`, `description`, `price`.
   - Inputs are rendered dynamically in `apps/web/src/app/tools/[sku]/page.tsx` from your schema.

5) Add tests (fast checks)
   - See `tests/validators.test.ts` and `tests/catalog.test.ts` for examples.
   - Add at least one valid/invalid example for your input schema.

## Pull requests

- Keep PRs focused and small.
- Include a short description of the change and any screenshots if UI-related.
- Ensure `pnpm test` passes locally.

## Questions

- Website: https://vellumlabs.app
- X: https://x.com/VellumLabsAi


