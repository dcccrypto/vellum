'use client';

import { motion } from 'framer-motion';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import Link from 'next/link';

const tools = [
  {
    id: 'img-gen-basic',
    name: 'Image Generation',
    price: '$0.03',
    description: 'Generate 768×768 PNG images from text prompts using Gemini AI',
    icon: '🎨',
    category: 'AI & Image',
  },
  {
    id: 'meme-maker',
    name: 'Meme Maker',
    price: '$0.03',
    description: 'Create custom memes with popular templates or your own images',
    icon: '😂',
    category: 'AI & Image',
  },
  {
    id: 'bg-remove',
    name: 'Background Removal',
    price: '$0.06',
    description: 'Remove backgrounds from images with transparent PNG output',
    icon: '✂️',
    category: 'AI & Image',
  },
  {
    id: 'upscale-2x',
    name: '2× Image Upscale',
    price: '$0.05',
    description: 'Upscale images 2× with quality enhancement (up to 2048px)',
    icon: '🔍',
    category: 'AI & Image',
  },
  {
    id: 'favicon',
    name: 'Favicon Generator',
    price: '$0.03',
    description: 'Generate multi-size favicons from 16px to 512px + ICO format',
    icon: '⭐',
    category: 'Utilities',
  },
  {
    id: 'urlsum',
    name: 'URL Summarizer',
    price: '$0.03',
    description: 'Extract and summarize webpage content with key entities',
    icon: '📄',
    category: 'Utilities',
  },
  {
    id: 'pdf2txt',
    name: 'PDF to Text',
    price: '$0.04',
    description: 'Extract text from PDF documents (up to 10MB)',
    icon: '📑',
    category: 'Utilities',
  },
];

function ToolsPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen pt-16">
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="max-w-7xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span className="text-sm font-medium">Try Vellum Services</span>
              </div>

              <h1 className="text-5xl sm:text-6xl font-bold mb-6">
                Test our{' '}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  micro-utilities
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                Interactive playground for all Vellum services. Test endpoints, see pricing, and understand the
                x402 payment flow.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tools.map((tool, index) => (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                  <Link href={`/tools/${tool.id}`}>
                    <div className="gradient-border-animated p-6 bg-background hover:bg-secondary/20 transition-all duration-300 hover:scale-105 group h-full">
                      <div className="flex items-start justify-between mb-4">
                        <span className="text-4xl" role="img" aria-label={tool.name}>
                          {tool.icon}
                        </span>
                        <div className="text-right">
                          <span className="text-sm font-bold text-primary block">{tool.price}</span>
                          <span className="text-xs text-muted-foreground">{tool.category}</span>
                        </div>
                      </div>

                      <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                        {tool.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">{tool.description}</p>

                      <div className="flex items-center text-xs text-primary font-medium">
                        <span>Try it now</span>
                        <svg
                          className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                          />
                        </svg>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default ToolsPage;

