'use client';

import { motion } from 'framer-motion';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import Link from 'next/link';

function DocsPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen pt-16">
        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-3xl mx-auto"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <span className="text-sm font-medium">Developer Documentation</span>
              </div>
              <h1 className="text-5xl font-bold mb-6">
                Integrate{' '}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Vellum
                </span>
                {' '}into Your Product
              </h1>
              <p className="text-xl text-muted-foreground">
                Complete technical guide for building with x402 payments and Vellum&apos;s micro-utility APIs
              </p>
            </motion.div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-4 gap-8">
              {/* Sidebar */}
              <motion.aside
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-1"
              >
                <div className="sticky top-24 space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide">Getting Started</h3>
                    <ul className="space-y-2 text-sm">
                      <li>
                        <a href="#introduction" className="text-muted-foreground hover:text-primary transition-colors">
                          Introduction
                        </a>
                      </li>
                      <li>
                        <a href="#quick-start" className="text-muted-foreground hover:text-primary transition-colors">
                          Quick Start
                        </a>
                      </li>
                      <li>
                        <a href="#installation" className="text-muted-foreground hover:text-primary transition-colors">
                          Installation
                        </a>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide">Core Concepts</h3>
                    <ul className="space-y-2 text-sm">
                      <li>
                        <a href="#x402-protocol" className="text-muted-foreground hover:text-primary transition-colors">
                          x402 Protocol
                        </a>
                      </li>
                      <li>
                        <a href="#payment-flow" className="text-muted-foreground hover:text-primary transition-colors">
                          Payment Flow
                        </a>
                      </li>
                      <li>
                        <a href="#authentication" className="text-muted-foreground hover:text-primary transition-colors">
                          Authentication
                        </a>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide">API Reference</h3>
                    <ul className="space-y-2 text-sm">
                      <li>
                        <a href="#endpoint" className="text-muted-foreground hover:text-primary transition-colors">
                          Payment Endpoint
                        </a>
                      </li>
                      <li>
                        <a href="#request-format" className="text-muted-foreground hover:text-primary transition-colors">
                          Request Format
                        </a>
                      </li>
                      <li>
                        <a href="#response-format" className="text-muted-foreground hover:text-primary transition-colors">
                          Response Format
                        </a>
                      </li>
                      <li>
                        <a href="#skus" className="text-muted-foreground hover:text-primary transition-colors">
                          Available SKUs
                        </a>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide">Advanced</h3>
                    <ul className="space-y-2 text-sm">
                      <li>
                        <a href="#errors" className="text-muted-foreground hover:text-primary transition-colors">
                          Error Handling
                        </a>
                      </li>
                      <li>
                        <a href="#examples" className="text-muted-foreground hover:text-primary transition-colors">
                          Code Examples
                        </a>
                      </li>
                      <li>
                        <a href="#sdks" className="text-muted-foreground hover:text-primary transition-colors">
                          SDKs & Libraries
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </motion.aside>

              {/* Content */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="lg:col-span-3 space-y-16"
              >
                {/* Introduction */}
                <section id="introduction">
                  <h2 className="text-3xl font-bold mb-4">Introduction</h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      Vellum is a production-ready API platform that enables instant cryptocurrency payments for
                      micro-utility services. Built on the{' '}
                      <a
                        href="https://docs.cdp.coinbase.com/x402/welcome"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        x402 protocol
                      </a>
                      , it allows developers to integrate pay-per-use AI and image processing services into their
                      applications without managing accounts, subscriptions, or complex authentication flows.
                    </p>
                    <p>
                      All payments are processed on Solana using USDC-SPL tokens through the PayAI facilitator,
                      ensuring fast, secure, and low-cost transactions. The protocol automatically handles payment
                      verification, settlement, and idempotency.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 mt-8">
                    <div className="gradient-border-animated p-6 bg-secondary/30">
                      <div className="text-2xl mb-2">⚡</div>
                      <h3 className="font-semibold mb-2">HTTP 402 Based</h3>
                      <p className="text-sm text-muted-foreground">
                        Native payment protocol over HTTP using status code 402
                      </p>
                    </div>
                    <div className="gradient-border-animated p-6 bg-secondary/30">
                      <div className="text-2xl mb-2">🔒</div>
                      <h3 className="font-semibold mb-2">No Accounts Needed</h3>
                      <p className="text-sm text-muted-foreground">
                        Pay directly with your Solana wallet, no signup required
                      </p>
                    </div>
                    <div className="gradient-border-animated p-6 bg-secondary/30">
                      <div className="text-2xl mb-2">💰</div>
                      <h3 className="font-semibold mb-2">Micro-Payments</h3>
                      <p className="text-sm text-muted-foreground">
                        Services start at $0.03 per request with no minimums
                      </p>
                    </div>
                  </div>
                </section>

                {/* Quick Start */}
                <section id="quick-start">
                  <h2 className="text-3xl font-bold mb-4">Quick Start</h2>
                  <p className="text-muted-foreground mb-6">
                    Get started with Vellum in under 5 minutes. This example shows how to generate an AI image
                    using the x402 protocol.
                  </p>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-3">1. Install x402 Client</h3>
                      <div className="gradient-border p-4 bg-secondary/50">
                        <pre className="text-sm overflow-x-auto">
                          <code>{`# Node.js / TypeScript
npm install x402-fetch

# Python
pip install x402`}</code>
                        </pre>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-3">2. Configure Your Wallet</h3>
                      <div className="gradient-border p-4 bg-secondary/50">
                        <pre className="text-sm overflow-x-auto">
                          <code>{`import { x402Fetch } from 'x402-fetch';
import { createWalletClient } from '@solana/web3.js';

// Initialize your Solana wallet
const walletClient = createWalletClient({
  privateKey: process.env.SOLANA_PRIVATE_KEY,
  network: 'mainnet-beta' // or 'devnet' for testing
});`}</code>
                        </pre>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-3">3. Make Your First Request</h3>
                      <div className="gradient-border p-4 bg-secondary/50">
                        <pre className="text-sm overflow-x-auto">
                          <code>{`// Generate an AI image
const response = await x402Fetch(
  'https://api.vellum.app/x402/pay?sku=img-gen-basic',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: 'A futuristic city at sunset with flying cars'
    })
  },
  {
    walletClient,
    maxAmount: '50000' // Max 50,000 USDC atomic units ($0.05)
  }
);

const data = await response.json();
console.log('Image URL:', data.signedUrl);
console.log('Direct download (base64):', data.base64 ? 'included' : 'not included');`}</code>
                        </pre>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Installation */}
                <section id="installation">
                  <h2 className="text-3xl font-bold mb-4">Installation</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-3">Node.js / TypeScript</h3>
                      <div className="gradient-border p-4 bg-secondary/50 mb-3">
                        <pre className="text-sm overflow-x-auto">
                          <code>{`npm install x402-fetch @solana/web3.js @solana/spl-token`}</code>
                        </pre>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        The x402-fetch package automatically handles payment detection, wallet signing, and request
                        retries.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-3">Python</h3>
                      <div className="gradient-border p-4 bg-secondary/50 mb-3">
                        <pre className="text-sm overflow-x-auto">
                          <code>{`pip install x402 solana`}</code>
                        </pre>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Python client provides the same automatic payment handling with a Pythonic interface.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-3">cURL (Manual)</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        For testing or manual integration, you can use cURL to see the raw HTTP 402 flow:
                      </p>
                      <div className="gradient-border p-4 bg-secondary/50">
                        <pre className="text-sm overflow-x-auto">
                          <code>{`# First request returns 402 with payment requirements
curl -i -X POST "https://api.vellum.app/x402/pay?sku=img-gen-basic" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt":"A sunset over mountains"}'`}</code>
                        </pre>
                      </div>
                    </div>
                  </div>
                </section>

                {/* x402 Protocol */}
                <section id="x402-protocol">
                  <h2 className="text-3xl font-bold mb-4">x402 Protocol</h2>
                  <p className="text-muted-foreground mb-6">
                    The x402 protocol extends HTTP with native payment support using the 402 Payment Required status
                    code. It enables seamless integration of cryptocurrency payments into any HTTP workflow.
                  </p>

                  <div className="gradient-border p-6 bg-background mb-6">
                    <h3 className="font-semibold mb-4">How It Works</h3>
                    <ol className="space-y-3 text-sm text-muted-foreground">
                      <li className="flex gap-3">
                        <span className="font-mono text-primary font-bold">1.</span>
                        <span>
                          <strong>Initial Request:</strong> Client makes a standard HTTP request to a paid endpoint
                        </span>
                      </li>
                      <li className="flex gap-3">
                        <span className="font-mono text-primary font-bold">2.</span>
                        <span>
                          <strong>402 Response:</strong> Server responds with HTTP 402 and payment requirements in
                          the response body
                        </span>
                      </li>
                      <li className="flex gap-3">
                        <span className="font-mono text-primary font-bold">3.</span>
                        <span>
                          <strong>Payment Creation:</strong> Client creates a payment transaction on Solana using
                          the provided details
                        </span>
                      </li>
                      <li className="flex gap-3">
                        <span className="font-mono text-primary font-bold">4.</span>
                        <span>
                          <strong>Verification:</strong> PayAI facilitator verifies the transaction is valid and
                          pending
                        </span>
                      </li>
                      <li className="flex gap-3">
                        <span className="font-mono text-primary font-bold">5.</span>
                        <span>
                          <strong>Settlement:</strong> Facilitator confirms the transaction has been settled on-chain
                        </span>
                      </li>
                      <li className="flex gap-3">
                        <span className="font-mono text-primary font-bold">6.</span>
                        <span>
                          <strong>Retry with Payment:</strong> Client retries the original request with an
                          <code className="mx-1 px-1 py-0.5 bg-secondary rounded text-xs">X-PAYMENT</code> header
                        </span>
                      </li>
                      <li className="flex gap-3">
                        <span className="font-mono text-primary font-bold">7.</span>
                        <span>
                          <strong>Success:</strong> Server returns HTTP 200 with the requested resource
                        </span>
                      </li>
                    </ol>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    The x402 client libraries handle steps 3-6 automatically, making integration seamless for
                    developers.
                  </p>
                </section>

                {/* Payment Flow */}
                <section id="payment-flow">
                  <h2 className="text-3xl font-bold mb-4">Payment Flow</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-3">Step 1: Initial 402 Response</h3>
                      <div className="gradient-border p-4 bg-secondary/50">
                        <pre className="text-sm overflow-x-auto">
                          <code>{`HTTP/1.1 402 Payment Required
Access-Control-Allow-Origin: *
Content-Type: application/json

{
  "accepts": [{
    "network": "solana-mainnet",
    "token": "USDC-SPL",
    "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "amountAtomic": "30000",
    "recipientAddress": "YourRecipientAddressHere...",
    "config": {
      "cluster": "mainnet-beta",
      "sku": "img-gen-basic",
      "description": "AI Image Generation (768x768 PNG)"
    }
  }]
}`}</code>
                        </pre>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-3">Step 2: Successful Response</h3>
                      <div className="gradient-border p-4 bg-secondary/50">
                        <pre className="text-sm overflow-x-auto">
                          <code>{`HTTP/1.1 200 OK
Access-Control-Expose-Headers: X-PAYMENT-RESPONSE
X-PAYMENT-RESPONSE: eyJ0eHNpZyI6IjVZdW...base64...
Content-Type: application/json

{
  "sku": "img-gen-basic",
  "signedUrl": "https://supabase.storage/.../image.png",
  "base64": "iVBORw0KGgoAAAANSUh...",
  "metadata": {
    "width": 768,
    "height": 768,
    "format": "png"
  }
}`}</code>
                        </pre>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Authentication */}
                <section id="authentication">
                  <h2 className="text-3xl font-bold mb-4">Authentication</h2>
                  <p className="text-muted-foreground mb-6">
                    Vellum uses the x402 protocol for authentication—no API keys needed. Simply provide a Solana
                    wallet with USDC to make paid requests.
                  </p>

                  <div className="gradient-border p-6 bg-background">
                    <h3 className="font-semibold mb-3">Wallet Requirements</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>Solana wallet with private key access</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>Sufficient USDC-SPL balance for service costs</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>Small amount of SOL for transaction fees (~0.000005 SOL per tx)</span>
                      </li>
                    </ul>
                  </div>
                </section>

                {/* API Endpoint */}
                <section id="endpoint">
                  <h2 className="text-3xl font-bold mb-4">Payment Endpoint</h2>
                  <div className="gradient-border-animated p-6 bg-secondary/30 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                      <code className="text-lg font-mono">POST /x402/pay</code>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-green-500/20 text-green-500 px-3 py-1 rounded-full font-bold">
                          PRODUCTION
                        </span>
                        <span className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full font-bold">
                          Single Endpoint
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      All microservices are accessed through this single endpoint. Use the <code className="px-1 py-0.5 bg-secondary rounded">sku</code> query parameter to specify which service to use.
                    </p>
                  </div>

                  <div className="gradient-border p-6 bg-background">
                    <h3 className="font-semibold mb-3">Base URL</h3>
                    <code className="text-sm bg-secondary px-3 py-1.5 rounded block">
                      https://api.vellum.app
                    </code>
                  </div>
                </section>

                {/* Request Format */}
                <section id="request-format">
                  <h2 className="text-3xl font-bold mb-4">Request Format</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-3">Query Parameters</h3>
                      <div className="gradient-border p-4 bg-background">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-2 pr-4 font-semibold">Parameter</th>
                              <th className="text-left py-2 pr-4 font-semibold">Type</th>
                              <th className="text-left py-2 font-semibold">Description</th>
                            </tr>
                          </thead>
                          <tbody className="text-muted-foreground">
                            <tr className="border-b border-border">
                              <td className="py-3 pr-4">
                                <code className="text-primary">sku</code>
                              </td>
                              <td className="py-3 pr-4">
                                <code>string</code>
                              </td>
                              <td className="py-3">
                                <span className="text-red-500 mr-2">required</span>
                                The SKU identifier for the service
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-3">Headers</h3>
                      <div className="gradient-border p-4 bg-background">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-2 pr-4 font-semibold">Header</th>
                              <th className="text-left py-2 font-semibold">Description</th>
                            </tr>
                          </thead>
                          <tbody className="text-muted-foreground">
                            <tr className="border-b border-border">
                              <td className="py-3 pr-4">
                                <code className="text-primary">Content-Type</code>
                              </td>
                              <td className="py-3">Must be <code>application/json</code></td>
                            </tr>
                            <tr>
                              <td className="py-3 pr-4">
                                <code className="text-primary">X-PAYMENT</code>
                              </td>
                              <td className="py-3">
                                <span className="text-muted-foreground mr-2">optional</span>
                                Payment proof header (added automatically by x402 clients)
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-3">Request Body</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Request body varies by SKU. Each service has its own input schema. See{' '}
                        <a href="#skus" className="text-primary hover:underline">
                          Available SKUs
                        </a>{' '}
                        for details.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Response Format */}
                <section id="response-format">
                  <h2 className="text-3xl font-bold mb-4">Response Format</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-3">Success Response (200)</h3>
                      <div className="gradient-border p-4 bg-secondary/50">
                        <pre className="text-sm overflow-x-auto">
                          <code>{`{
  "sku": "img-gen-basic",
  "signedUrl": "https://supabase.storage/.../output.png?token=...",
  "base64": "iVBORw0KGgoAAAANSUh...", // Only for outputs < 1MB
  "metadata": {
    // Service-specific metadata
  }
}`}</code>
                        </pre>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-3">Payment Required (402)</h3>
                      <div className="gradient-border p-4 bg-secondary/50">
                        <pre className="text-sm overflow-x-auto">
                          <code>{`{
  "accepts": [{
    "network": "solana-mainnet",
    "token": "USDC-SPL",
    "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "amountAtomic": "30000",
    "recipientAddress": "...",
    "config": {
      "cluster": "mainnet-beta",
      "sku": "img-gen-basic",
      "description": "Service description"
    }
  }]
}`}</code>
                        </pre>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-3">Error Response (400/500)</h3>
                      <div className="gradient-border p-4 bg-secondary/50">
                        <pre className="text-sm overflow-x-auto">
                          <code>{`{
  "error": "Error message describing what went wrong"
}`}</code>
                        </pre>
                      </div>
                    </div>
                  </div>
                </section>

                {/* SKUs */}
                <section id="skus">
                  <h2 className="text-3xl font-bold mb-4">Available SKUs</h2>
                  <p className="text-muted-foreground mb-6">
                    Each SKU represents a specific microservice with its own pricing, input schema, and output
                    format.
                  </p>

                  <div className="space-y-4">
                    {[
                      {
                        id: 'img-gen-basic',
                        name: 'AI Image Generation',
                        price: '$0.03',
                        description: 'Generate 768×768 PNG images from text prompts using Gemini AI',
                        input: '{ "prompt": "string" }',
                        output: 'PNG image via signedUrl + base64',
                      },
                      {
                        id: 'meme-maker',
                        name: 'Meme Maker',
                        price: '$0.03',
                        description: 'Create memes with custom text overlays on popular templates',
                        input: '{ "top": "string", "bottom": "string", "template": "string?" }',
                        output: 'JPEG meme via signedUrl + base64',
                      },
                      {
                        id: 'bg-remove',
                        name: 'Background Removal',
                        price: '$0.06',
                        description: 'Remove backgrounds from images with transparent PNG output',
                        input: '{ "imageUrl": "string" }',
                        output: 'Transparent PNG via signedUrl',
                      },
                      {
                        id: 'upscale-2x',
                        name: '2× Image Upscale',
                        price: '$0.05',
                        description: 'Upscale images 2× with Lanczos3 interpolation (max 2048px)',
                        input: '{ "imageUrl": "string" }',
                        output: 'Upscaled PNG via signedUrl',
                      },
                      {
                        id: 'favicon',
                        name: 'Favicon Generator',
                        price: '$0.03',
                        description: 'Generate multi-size favicons (16-512px) + ICO format',
                        input: '{ "imageUrl": "string" }',
                        output: 'ZIP file with all sizes via signedUrl',
                      },
                      {
                        id: 'urlsum',
                        name: 'URL Summarizer',
                        price: '$0.03',
                        description: 'Extract and summarize webpage content with key entities',
                        input: '{ "url": "string" }',
                        output: 'JSON with title, summary, entities',
                      },
                      {
                        id: 'pdf2txt',
                        name: 'PDF to Text',
                        price: '$0.04',
                        description: 'Extract text from PDF documents (up to 10MB)',
                        input: '{ "pdfUrl": "string" }',
                        output: 'Plain text content via signedUrl',
                      },
                    ].map((sku) => (
                      <div key={sku.id} className="gradient-border-animated p-6 bg-background">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold mb-1">{sku.name}</h3>
                            <code className="text-xs text-muted-foreground font-mono">{sku.id}</code>
                          </div>
                          <span className="text-sm font-bold text-primary whitespace-nowrap">{sku.price}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">{sku.description}</p>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                              Input Schema
                            </div>
                            <code className="text-xs bg-secondary px-2 py-1 rounded block">{sku.input}</code>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                              Output Format
                            </div>
                            <code className="text-xs bg-secondary px-2 py-1 rounded block">{sku.output}</code>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center gap-3">
                          <Link
                            href={`/tools/${sku.id}`}
                            className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                          >
                            Try it live
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 7l5 5m0 0l-5 5m5-5H6"
                              />
                            </svg>
                          </Link>
                          <span className="text-muted-foreground">•</span>
                          <a
                            href={`#example-${sku.id}`}
                            className="text-sm text-muted-foreground hover:text-primary"
                          >
                            View example
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Error Handling */}
                <section id="errors">
                  <h2 className="text-3xl font-bold mb-4">Error Handling</h2>
                  
                  <div className="gradient-border p-6 bg-background mb-6">
                    <h3 className="font-semibold mb-4">HTTP Status Codes</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-4">
                        <span className="font-mono text-yellow-500 font-bold min-w-[60px]">402</span>
                        <div>
                          <div className="font-semibold mb-1">Payment Required</div>
                          <div className="text-muted-foreground">
                            Payment has not been made or verification failed. Retry with valid X-PAYMENT header.
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <span className="font-mono text-green-500 font-bold min-w-[60px]">200</span>
                        <div>
                          <div className="font-semibold mb-1">Success</div>
                          <div className="text-muted-foreground">
                            Request successful. Response includes the requested resource.
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <span className="font-mono text-red-500 font-bold min-w-[60px]">400</span>
                        <div>
                          <div className="font-semibold mb-1">Bad Request</div>
                          <div className="text-muted-foreground">
                            Invalid input parameters or missing required fields. Check error message.
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <span className="font-mono text-red-500 font-bold min-w-[60px]">404</span>
                        <div>
                          <div className="font-semibold mb-1">Not Found</div>
                          <div className="text-muted-foreground">
                            Invalid SKU or endpoint not found.
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <span className="font-mono text-red-500 font-bold min-w-[60px]">500</span>
                        <div>
                          <div className="font-semibold mb-1">Internal Server Error</div>
                          <div className="text-muted-foreground">
                            Server error during processing. Payment will not be charged if fulfillment fails.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="gradient-border p-6 bg-background">
                    <h3 className="font-semibold mb-3">Idempotency</h3>
                    <p className="text-sm text-muted-foreground">
                      All requests are idempotent based on the payment transaction signature. If a request is
                      retried with the same payment, the cached result will be returned without re-processing or
                      double-charging.
                    </p>
                  </div>
                </section>

                {/* Code Examples */}
                <section id="examples">
                  <h2 className="text-3xl font-bold mb-4">Code Examples</h2>
                  
                  <div className="space-y-6">
                    <div id="example-img-gen-basic">
                      <h3 className="text-xl font-semibold mb-3">Image Generation (TypeScript)</h3>
                      <div className="gradient-border p-4 bg-secondary/50">
                        <pre className="text-sm overflow-x-auto">
                          <code>{`import { x402Fetch } from 'x402-fetch';
import { createWalletClient } from '@solana/web3.js';

async function generateImage(prompt: string) {
  const walletClient = createWalletClient({
    privateKey: process.env.SOLANA_PRIVATE_KEY!,
    network: 'mainnet-beta'
  });

  const response = await x402Fetch(
    'https://api.vellum.app/x402/pay?sku=img-gen-basic',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    },
    {
      walletClient,
      maxAmount: '50000' // $0.05 max
    }
  );

  if (!response.ok) {
    throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
  }

  const data = await response.json();
  return {
    url: data.signedUrl,
    base64: data.base64
  };
}

// Usage
const image = await generateImage('A futuristic city at sunset');
console.log('Image URL:', image.url);`}</code>
                        </pre>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-3">PDF Text Extraction (Python)</h3>
                      <div className="gradient-border p-4 bg-secondary/50">
                        <pre className="text-sm overflow-x-auto">
                          <code>{`from x402 import X402Client
from solana.keypair import Keypair
import os

def extract_pdf_text(pdf_url: str) -> str:
    # Initialize wallet
    keypair = Keypair.from_secret_key(
        os.environ['SOLANA_PRIVATE_KEY']
    )
    
    # Create x402 client
    client = X402Client(
        wallet=keypair,
        network='mainnet-beta',
        max_amount=50000  # $0.05 max
    )
    
    # Make request
    response = client.post(
        'https://api.vellum.app/x402/pay',
        params={'sku': 'pdf2txt'},
        json={'pdfUrl': pdf_url}
    )
    
    return response.json()['text']

# Usage
text = extract_pdf_text('https://example.com/document.pdf')
print(f'Extracted {len(text)} characters')`}</code>
                        </pre>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-3">Manual cURL Flow</h3>
                      <div className="gradient-border p-4 bg-secondary/50">
                        <pre className="text-sm overflow-x-auto">
                          <code>{`# Step 1: Initial request (returns 402)
curl -i -X POST "https://api.vellum.app/x402/pay?sku=urlsum" \\
  -H "Content-Type: application/json" \\
  -d '{"url":"https://example.com"}'

# Response will be HTTP 402 with payment requirements

# Step 2: Create payment transaction (use payment details from 402 response)
# ... create and sign transaction on Solana ...

# Step 3: Verify payment with PayAI facilitator
# ... call facilitator verify endpoint ...

# Step 4: Settle payment with PayAI facilitator
# ... call facilitator settle endpoint ...

# Step 5: Retry with X-PAYMENT header
curl -X POST "https://api.vellum.app/x402/pay?sku=urlsum" \\
  -H "Content-Type: application/json" \\
  -H "X-PAYMENT: <base64-encoded-payment-proof>" \\
  -d '{"url":"https://example.com"}'

# Response will be HTTP 200 with the summary`}</code>
                        </pre>
                      </div>
                    </div>
                  </div>
                </section>

                {/* SDKs */}
                <section id="sdks">
                  <h2 className="text-3xl font-bold mb-4">SDKs & Libraries</h2>
                  <p className="text-muted-foreground mb-6">
                    Official x402 client libraries handle the payment flow automatically, making integration
                    seamless.
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <a
                      href="https://www.npmjs.com/package/x402-fetch"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="gradient-border-animated-fast p-6 bg-background hover:bg-secondary/20 transition-colors group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                          x402-fetch
                        </h3>
                        <svg
                          className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Node.js / TypeScript client with Fetch API interface
                      </p>
                      <code className="text-xs bg-secondary px-2 py-1 rounded">npm install x402-fetch</code>
                    </a>

                    <a
                      href="https://pypi.org/project/x402/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="gradient-border-animated-fast p-6 bg-background hover:bg-secondary/20 transition-colors group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                          x402
                        </h3>
                        <svg
                          className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Python client with requests-compatible interface
                      </p>
                      <code className="text-xs bg-secondary px-2 py-1 rounded">pip install x402</code>
                    </a>
                  </div>

                  <div className="mt-8 gradient-border p-6 bg-background">
                    <h3 className="font-semibold mb-3">Additional Resources</h3>
                    <ul className="space-y-2 text-sm">
                      <li>
                        <a
                          href="https://docs.cdp.coinbase.com/x402/welcome"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          x402 Protocol Documentation →
                        </a>
                      </li>
                      <li>
                        <a
                          href="https://github.com/coinbase/x402"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          x402 GitHub Repository →
                        </a>
                      </li>
                      <li>
                        <a
                          href="https://facilitator.payai.network"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          PayAI Facilitator Documentation →
                        </a>
                      </li>
                    </ul>
                  </div>
                </section>

                {/* CTA */}
                <section className="gradient-border-pulse p-12 bg-gradient-to-br from-primary/10 to-accent/10 text-center">
                  <h2 className="text-3xl font-bold mb-4">Ready to Build?</h2>
                  <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                    Start integrating Vellum&apos;s micro-utilities into your application today. No signups, no
                    subscriptions—just pay-per-use.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/tools" className="gradient-border-animated px-8 py-4 inline-block font-semibold">
                      Try Services Live
                    </Link>
                    <Link
                      href="/#products"
                      className="px-8 py-4 font-semibold bg-secondary hover:bg-secondary/80 rounded-lg transition-colors inline-block"
                    >
                      View All Services
                    </Link>
                  </div>
                </section>
              </motion.div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default DocsPage;
