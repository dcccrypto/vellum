'use client';

import { motion } from 'framer-motion';

const steps = [
  {
    number: '1',
    title: 'Offer',
    description: 'Send a POST request. Get HTTP 402 with payment requirements.',
    code: 'POST /x402/pay?sku=img-gen-basic\n← 402 Payment Required',
  },
  {
    number: '2',
    title: 'Pay',
    description: 'Sign transaction on Solana and retry with X-PAYMENT header.',
    code: 'X-PAYMENT: <base64_payload>\n← Verify → Settle',
  },
  {
    number: '3',
    title: 'Deliver',
    description: 'Receive result with signed URL. X-PAYMENT-RESPONSE header included.',
    code: '← 200 OK\n{ "signedUrl": "..." }',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4">How it works</h2>
          <p className="text-lg text-muted-foreground">
            Three simple steps powered by x402 protocol
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2, duration: 0.5 }}
              className="relative"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent -z-10" />
              )}

              <div className="text-center">
                {/* Step number */}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground font-bold text-2xl mb-4">
                  {step.number}
                </div>

                {/* Title */}
                <h3 className="text-2xl font-semibold mb-2">{step.title}</h3>

                {/* Description */}
                <p className="text-muted-foreground mb-4">{step.description}</p>

                {/* Code snippet */}
                <div className="gradient-border p-4 bg-secondary/50 rounded-lg">
                  <pre className="text-xs text-left overflow-x-auto">
                    <code>{step.code}</code>
                  </pre>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional info */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-16 p-8 gradient-border bg-secondary/30 rounded-lg"
        >
          <h3 className="text-xl font-semibold mb-4">Technical Details</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• <strong>Protocol:</strong> HTTP 402 (x402) with PayAI facilitator</li>
            <li>• <strong>Payment:</strong> USDC (SPL) on Solana mainnet</li>
            <li>• <strong>Delivery:</strong> Supabase Storage with signed URLs (1hr TTL)</li>
            <li>• <strong>Idempotency:</strong> Safe retries using transaction signatures</li>
            <li>• <strong>CORS:</strong> Enabled with exposed X-PAYMENT-RESPONSE header</li>
          </ul>
        </motion.div>
      </div>
    </section>
  );
}

