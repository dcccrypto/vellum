'use client';

import { use, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import Link from 'next/link';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletButton } from '@/components/WalletButton';
import { createX402Client, formatUSDC, usdToMicroUsdc } from '@vellum/shared/src/x402-solana';
import { checkUSDCBalance } from '@/lib/x402-payment';

const skuDetails: Record<string, any> = {
  'img-gen-basic': {
    name: 'Image Generation',
    icon: '🎨',
    price: '$0.03',
    priceAtomic: '30000',
    description: 'Generate 768×768 PNG images from text prompts using Gemini AI',
    inputFields: [
      { name: 'prompt', label: 'Text Prompt', type: 'textarea', placeholder: 'A beautiful sunset over mountains, digital art', required: true },
    ],
  },
  'meme-maker': {
    name: 'Meme Maker',
    icon: '😂',
    price: '$0.03',
    priceAtomic: '30000',
    description: 'Create a meme with AI from a single prompt',
    inputFields: [
      { name: 'prompt', label: 'Meme Idea', type: 'textarea', placeholder: 'A cat hacking on a laptop with the caption “Ship it!”', required: true },
    ],
  },
  'bg-remove': {
    name: 'Background Removal',
    icon: '✂️',
    price: '$0.06',
    priceAtomic: '60000',
    description: 'Remove backgrounds from images',
    inputFields: [
      { name: 'imageUrl', label: 'Image URL', type: 'text', placeholder: 'https://example.com/image.jpg', required: false },
      { name: 'imageBase64', label: 'Upload Image', type: 'file', accept: 'image/*', required: false },
    ],
  },
  'upscale-2x': {
    name: '2× Upscale',
    icon: '🔍',
    price: '$0.05',
    priceAtomic: '50000',
    description: 'Upscale images 2×',
    inputFields: [
      { name: 'imageUrl', label: 'Image URL', type: 'text', placeholder: 'https://example.com/image.jpg', required: false },
      { name: 'imageBase64', label: 'Upload Image', type: 'file', accept: 'image/*', required: false },
    ],
  },
  favicon: {
    name: 'Favicon Generator',
    icon: '⭐',
    price: '$0.03',
    priceAtomic: '30000',
    description: 'Generate multi-size favicons',
    inputFields: [
      { name: 'imageUrl', label: 'Logo URL', type: 'text', placeholder: 'https://example.com/logo.png', required: false },
      { name: 'imageBase64', label: 'Upload Logo (PNG with transparency)', type: 'file', accept: 'image/png', required: false },
    ],
  },
  urlsum: {
    name: 'URL Summarizer',
    icon: '📄',
    price: '$0.03',
    priceAtomic: '30000',
    description: 'Summarize webpage content',
    inputFields: [
      { name: 'url', label: 'URL', type: 'text', placeholder: 'https://example.com/article', required: true },
    ],
  },
  'pdf2txt': {
    name: 'PDF to Text',
    icon: '📑',
    price: '$0.04',
    priceAtomic: '40000',
    description: 'Extract text from PDFs',
    inputFields: [
      { name: 'pdfUrl', label: 'PDF URL', type: 'text', placeholder: 'https://example.com/document.pdf', required: false },
      { name: 'pdfBase64', label: 'Upload PDF', type: 'file', accept: 'application/pdf', required: false },
    ],
  },
};

function ToolPage({ params }: { params: Promise<{ sku: string }> }) {
  const { sku } = use(params);
  const tool = skuDetails[sku];
  
  const wallet = useWallet();
  const { connection } = useConnection();
  
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [balanceInfo, setBalanceInfo] = useState<any>(null);
  const [copied, setCopied] = useState<string>('');

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(''), 1500);
    } catch {}
  };

  if (!tool) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen pt-16 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Tool Not Found</h1>
            <Link href="/tools" className="text-primary hover:underline">
              ← Back to Tools
            </Link>
          </div>
        </div>
      </>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check wallet connection
    if (!wallet.connected || !wallet.publicKey) {
      setErrorMessage('Please connect your wallet first');
      setStep('error');
      return;
    }

    setLoading(true);
    setResponse(null);
    setErrorMessage('');
    setStep('processing');

    try {
      // Check balance silently
      const balance = await checkUSDCBalance(wallet, connection, tool.priceAtomic);
      setBalanceInfo(balance);
      
      if (!balance.hasEnough) {
        throw new Error(
          `Insufficient USDC. You have ${formatUSDC(balance.balance.toString())} but need ${formatUSDC(balance.required.toString())}`
        );
      }

      // Create x402 client with automatic payment handling (mainnet)
      const client = createX402Client({
        wallet: {
          address: wallet.publicKey!.toBase58(),
          publicKey: wallet.publicKey,
          signTransaction: wallet.signTransaction!,
        },
        network: 'solana', // mainnet-beta
        maxPaymentAmount: BigInt(usdToMicroUsdc(10)), // Safety limit: $10 max
      });

      // Make request - client automatically handles 402 payments
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await client.fetch(`${apiUrl}/x402/pay?sku=${encodeURIComponent(sku)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      // Prefer body (client clones body for logging), fallback to header if needed
      let result: any;
      try {
        result = await res.json();
      } catch {
        const headerValue = res.headers.get('X-PAYMENT-RESPONSE');
        result = headerValue ? JSON.parse(atob(headerValue)) : {};
      }
      setResponse(result);
      setStep('success');
    } catch (error) {
      console.error('Payment error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navigation />
      <main className="min-h-screen pt-16 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-12">
            <Link href="/tools" className="text-sm text-primary hover:underline mb-4 inline-block">
              ← Back to all tools
            </Link>
            <div className="flex items-start justify-between flex-wrap gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-5xl">{tool.icon}</span>
                  <div>
                    <h1 className="text-4xl font-bold">{tool.name}</h1>
                    <p className="text-lg text-muted-foreground mt-2">{tool.description}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-row gap-3 items-center">
                <div className="flex items-center gap-2 px-5 h-[44px] bg-secondary/50 border border-border rounded-lg">
                  <span className="text-sm text-muted-foreground">Price:</span>
                  <span className="text-lg font-bold text-primary">{tool.price}</span>
                </div>
                <div className="wallet-button-wrapper">
                  <WalletButton />
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Input Form */}
            <div>
              <div className="p-8 bg-background border border-border rounded-xl shadow-lg">
                <h2 className="text-2xl font-semibold mb-6">Configure & Pay</h2>
                
                {!wallet.connected && (
                  <div className="mb-6 p-4 rounded-lg bg-yellow-500/5 border-l-4 border-yellow-500">
                    <p className="text-sm text-yellow-200">
                      Connect your wallet above to get started
                    </p>
                  </div>
                )}

                {wallet.connected && balanceInfo && !balanceInfo.hasEnough && step === 'error' && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 rounded-lg bg-red-500/5 border-l-4 border-red-500"
                  >
                    <p className="font-semibold text-red-200 mb-2">Insufficient USDC Balance</p>
                    <p className="text-sm text-red-200/80 mb-3">
                      Balance: {formatUSDC(balanceInfo.balance.toString())} • Required: {formatUSDC(balanceInfo.required.toString())}
                    </p>
                    <a 
                      href="https://spl-token-faucet.com/?token-name=USDC-Dev"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-red-300 hover:text-red-200 underline"
                    >
                      Get Devnet USDC →
                    </a>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {tool.inputFields.map((field: any) => (
                    <div key={field.name}>
                      <label className="block text-sm font-medium mb-2">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea
                          name={field.name}
                          placeholder={field.placeholder}
                          required={field.required}
                          value={formData[field.name] || ''}
                          onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                          className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none"
                          rows={5}
                          disabled={loading}
                        />
                      ) : field.type === 'file' ? (
                        <input
                          type="file"
                          name={field.name}
                          accept={field.accept}
                          required={field.required}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = () => {
                              const result = reader.result as string; // data URL
                              const base64 = result.includes(',') ? result.split(',').pop()! : result;
                              setFormData({ ...formData, [field.name]: base64 });
                            };
                            reader.readAsDataURL(file);
                          }}
                          className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                          disabled={loading}
                        />
                      ) : (
                        <input
                          type={field.type}
                          name={field.name}
                          placeholder={field.placeholder}
                          required={field.required}
                          value={formData[field.name] || ''}
                          onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                          className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                          disabled={loading}
                        />
                      )}
                    </div>
                  ))}

                  <motion.button
                    type="submit"
                    disabled={loading || !wallet.connected}
                    whileHover={{ scale: wallet.connected && !loading ? 1.02 : 1 }}
                    whileTap={{ scale: wallet.connected && !loading ? 0.98 : 1 }}
                    className="pay-button w-full px-6 py-4 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <AnimatePresence mode="wait">
                      {loading ? (
                        <motion.span
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center justify-center gap-2"
                        >
                          Processing payment...
                        </motion.span>
                      ) : (
                        <motion.span
                          key="idle"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          {wallet.connected ? `Pay ${tool.price} & Get Result` : 'Connect Wallet First'}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </form>
              </div>
            </div>

            {/* Response */}
            <div>
              <div className="p-8 bg-background border border-border rounded-xl shadow-lg min-h-[500px]">
                <h2 className="text-2xl font-semibold mb-6">Result</h2>
                
                <AnimatePresence mode="wait">
                  {!response && step === 'idle' && (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-12 text-muted-foreground"
                    >
                      <div className="text-6xl mb-4">✨</div>
                      <p>Fill out the form and submit to get your result</p>
                    </motion.div>
                  )}

                  {step === 'error' && errorMessage && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="p-4 rounded-lg bg-red-500/5 border-l-4 border-red-500"
                    >
                      <p className="font-semibold text-red-200 mb-1">Error</p>
                      <p className="text-sm text-red-200/80">{errorMessage}</p>
                    </motion.div>
                  )}

                  {step === 'success' && response && (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4"
                    >
                      <div className="p-4 rounded-lg bg-green-500/5 border-l-4 border-green-500">
                        <p className="font-semibold text-green-200 mb-2">Payment Successful</p>
                        {response.txSig && (
                          <div className="flex items-start gap-2">
                            <span className="text-sm text-green-200/80 mt-[2px]">Tx:</span>
                            <div className="flex-1 min-w-0">
                              <div className="px-2 py-1 rounded bg-green-950/40 border border-green-800 text-xs text-green-200/80 whitespace-pre-wrap break-all">
                                {response.txSig}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(response.txSig, 'tx')}
                              className="shrink-0 inline-flex items-center px-2 py-1 rounded-md border border-green-700 text-green-200 text-xs hover:bg-green-900/30"
                            >
                              {copied === 'tx' ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Image preview - prefer signedUrl, fallback to base64 */}
                      {(response.signedUrl || response.imageBase64) && sku !== 'favicon' && (
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Preview</h4>
                          <div className="mt-1 flex flex-col gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={response.signedUrl || `data:image/png;base64,${response.imageBase64}`}
                              alt="Result"
                              className="max-w-full h-auto rounded border border-border"
                            />
                            <div>
                              <a
                                href={response.signedUrl || `data:image/png;base64,${response.imageBase64}`}
                                download={`result-${sku}.png`}
                                className="inline-flex items-center px-4 py-2 rounded-md border border-primary/40 bg-primary/10 hover:bg-primary/20 text-sm"
                              >
                                Download Image
                              </a>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Favicon pack download */}
                      {response.signedUrl && sku === 'favicon' && (
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Favicon Pack</h4>
                          <div className="p-3 border border-border rounded-lg bg-secondary/50">
                            <p className="text-sm mb-2">A ZIP with production-ready favicons was generated.</p>
                            <a
                              href={response.signedUrl}
                              download={`favicons-${sku}.zip`}
                              className="inline-flex items-center px-4 py-2 rounded-md border border-primary/40 bg-primary/10 hover:bg-primary/20 text-sm"
                            >
                              Download Favicon Pack
                            </a>
                            {Array.isArray(response.files) && response.files.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs mb-1 text-muted-foreground">Files included:</p>
                                <ul className="text-xs grid grid-cols-1 sm:grid-cols-2 gap-1 list-disc pl-5">
                                  {response.files.map((f: string) => (
                                    <li key={f}>{f}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* URL Summarizer: show summary, bullets, and entities */}
                      {(response.summary || response.bullets || response.entities) && (
                        <div className="space-y-4">
                          {response.summary && (
                            <div>
                              <h4 className="text-sm font-semibold mb-2">Summary</h4>
                              <p className="text-sm text-muted-foreground leading-relaxed p-3 bg-secondary/50 border border-border rounded-lg">
                                {response.summary}
                              </p>
                            </div>
                          )}
                          {response.bullets && Array.isArray(response.bullets) && response.bullets.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold mb-2">Key Points</h4>
                              <ul className="space-y-2">
                                {response.bullets.map((bullet: string, idx: number) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm">
                                    <span className="text-primary mt-1 shrink-0">•</span>
                                    <span>{bullet}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {response.entities && Array.isArray(response.entities) && response.entities.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold mb-2">Key Entities</h4>
                              <div className="flex flex-wrap gap-2">
                                {response.entities.map((entity: string, idx: number) => (
                                  <span
                                    key={idx}
                                    className="px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-xs"
                                  >
                                    {entity}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* PDF to Text: show clean textbox + copy */}
                      {response.text && (
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Extracted Text {response.pageCount ? `(Pages: ${response.pageCount})` : ''}</h4>
                          <div className="relative">
                            <textarea
                              readOnly
                              value={response.text}
                              className="w-full h-64 p-3 bg-secondary/50 border border-border rounded-lg font-mono text-sm whitespace-pre-wrap"
                            />
                            <div className="absolute right-2 bottom-2">
                              <button
                                type="button"
                                onClick={() => copyToClipboard(response.text, 'pdftext')}
                                className="inline-flex items-center px-3 py-1.5 rounded-md border border-primary/40 bg-primary/10 hover:bg-primary/20 text-xs"
                              >
                                {copied === 'pdftext' ? 'Copied' : 'Copy'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div>
                        <h4 className="text-sm font-semibold mb-2">Full Response</h4>
                        <div className="p-4 border border-border bg-secondary/50 rounded-lg max-h-96 overflow-auto">
                          <pre className="text-xs whitespace-pre-wrap break-all">
                            <code>{JSON.stringify(
                              Object.fromEntries(
                                Object.entries(response).map(([k, v]) => {
                                  // Hide large base64 strings in the JSON view
                                  if (typeof v === 'string' && (k.includes('base64') || k.includes('Base64')) && v.length > 100) {
                                    return [k, `<base64 data: ${v.length} chars>`];
                                  }
                                  // Truncate long text fields
                                  if (typeof v === 'string' && v.length > 500 && k === 'text') {
                                    return [k, v.substring(0, 500) + '... (truncated)'];
                                  }
                                  return [k, v];
                                })
                              ),
                              null,
                              2
                            )}</code>
                          </pre>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default ToolPage;
