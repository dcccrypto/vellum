# Vellum x402 HTTP Tests

These curl commands test the x402 payment flow. Replace `localhost:3001` with your actual API URL.

## 1. Image Generation Basic

### Offer (expect 402)
```bash
curl -i -X POST "http://localhost:3001/x402/pay?sku=img-gen-basic" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"A beautiful sunset over mountains"}'
```

### Bad retry (fake header, expect 402 again)
```bash
curl -i -X POST "http://localhost:3001/x402/pay?sku=img-gen-basic" \
  -H "X-PAYMENT: eyJmYWtlIjoidGhpcyBpcyBub3QgcmlnaHQifQ==" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"A beautiful sunset over mountains"}'
```

---

## 2. Meme Maker

### Offer (expect 402)
```bash
curl -i -X POST "http://localhost:3001/x402/pay?sku=meme-maker" \
  -H "Content-Type: application/json" \
  -d '{"template":"drake","top":"Regular payments","bottom":"x402 payments"}'
```

### Bad retry (fake header)
```bash
curl -i -X POST "http://localhost:3001/x402/pay?sku=meme-maker" \
  -H "X-PAYMENT: eyJub3QiOiJ2YWxpZCJ9" \
  -H "Content-Type: application/json" \
  -d '{"template":"drake","top":"Regular payments","bottom":"x402 payments"}'
```

---

## 3. Background Removal

### Offer (expect 402)
```bash
curl -i -X POST "http://localhost:3001/x402/pay?sku=bg-remove" \
  -H "Content-Type: application/json" \
  -d '{"imageUrl":"https://example.com/image.jpg"}'
```

### Bad retry (fake header)
```bash
curl -i -X POST "http://localhost:3001/x402/pay?sku=bg-remove" \
  -H "X-PAYMENT: eyJpbnZhbGlkIjp0cnVlfQ==" \
  -H "Content-Type: application/json" \
  -d '{"imageUrl":"https://example.com/image.jpg"}'
```

---

## 4. Image Upscale 2×

### Offer (expect 402)
```bash
curl -i -X POST "http://localhost:3001/x402/pay?sku=upscale-2x" \
  -H "Content-Type: application/json" \
  -d '{"imageUrl":"https://example.com/small-image.jpg"}'
```

### Bad retry (fake header)
```bash
curl -i -X POST "http://localhost:3001/x402/pay?sku=upscale-2x" \
  -H "X-PAYMENT: eyJ3cm9uZyI6InBheWxvYWQifQ==" \
  -H "Content-Type: application/json" \
  -d '{"imageUrl":"https://example.com/small-image.jpg"}'
```

---

## 5. Favicon Generator

### Offer (expect 402)
```bash
curl -i -X POST "http://localhost:3001/x402/pay?sku=favicon" \
  -H "Content-Type: application/json" \
  -d '{"imageUrl":"https://example.com/logo.png"}'
```

### Bad retry (fake header)
```bash
curl -i -X POST "http://localhost:3001/x402/pay?sku=favicon" \
  -H "X-PAYMENT: eyJiYWQiOiJoZWFkZXIifQ==" \
  -H "Content-Type: application/json" \
  -d '{"imageUrl":"https://example.com/logo.png"}'
```

---

## 6. URL Summarizer

### Offer (expect 402)
```bash
curl -i -X POST "http://localhost:3001/x402/pay?sku=urlsum" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://en.wikipedia.org/wiki/Solana_(blockchain_platform)"}'
```

### Bad retry (fake header)
```bash
curl -i -X POST "http://localhost:3001/x402/pay?sku=urlsum" \
  -H "X-PAYMENT: eyJub3QiOiJyZWFsIn0=" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://en.wikipedia.org/wiki/Solana_(blockchain_platform)"}'
```

---

## 7. PDF to Text

### Offer (expect 402)
```bash
curl -i -X POST "http://localhost:3001/x402/pay?sku=pdf2txt" \
  -H "Content-Type: application/json" \
  -d '{"pdfUrl":"https://example.com/document.pdf"}'
```

### Bad retry (fake header)
```bash
curl -i -X POST "http://localhost:3001/x402/pay?sku=pdf2txt" \
  -H "X-PAYMENT: eyJmYWtlIjoicGF5bWVudCJ9" \
  -H "Content-Type: application/json" \
  -d '{"pdfUrl":"https://example.com/document.pdf"}'
```

---

## Expected Responses

### 402 Payment Required
```json
{
  "x402Version": 1,
  "accepts": [
    {
      "scheme": "exact",
      "network": "solana",
      "asset": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      "maxAmountRequired": "30000",
      "payTo": "<USDC_ATA>",
      "resource": "https://api.vellum.app/x402/pay?sku=img-gen-basic",
      "description": "Generate 768×768 PNG image from text prompt",
      "mimeType": "application/json",
      "maxTimeoutSeconds": 600,
      "outputSchema": { ... },
      "extra": { ... }
    }
  ]
}
```

### 200 OK (with valid payment)
```json
{
  "signedUrl": "https://supabase.co/storage/.../file.png?token=...",
  "imageBase64": "iVBORw0KGgoAAAANSUh..."
}
```

Headers will include:
```
Access-Control-Allow-Origin: *
Access-Control-Expose-Headers: X-PAYMENT-RESPONSE
X-PAYMENT-RESPONSE: eyJzaWduZWRVcmwiOiJodHRwczovLy4uLiJ9
```

---

## Testing with Valid Payment

To test with a real payment, you'll need to:

1. Get the 402 response
2. Sign a Solana transaction sending USDC to the `payTo` address
3. Encode the transaction details as base64
4. Retry with the `X-PAYMENT` header set to that base64 payload

This requires a Solana wallet and USDC. For automated testing, use the PayAI SDK or x402 client libraries.

