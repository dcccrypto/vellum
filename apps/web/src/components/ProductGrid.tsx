'use client';

import { motion } from 'framer-motion';
import { ProductCard } from './ProductCard';

const products = [
  {
    id: 'img-gen-basic',
    name: 'Image Generation',
    description: 'Generate 768×768 PNG images from text prompts using Gemini AI',
    price: '$0.03',
    icon: '🎨',
  },
  {
    id: 'meme-maker',
    name: 'Meme Maker',
    description: 'Create custom memes with templates or your own images',
    price: '$0.03',
    icon: '😂',
  },
  {
    id: 'bg-remove',
    name: 'Background Removal',
    description: 'Remove backgrounds from images with transparent PNG output',
    price: '$0.06',
    icon: '✂️',
  },
  {
    id: 'upscale-2x',
    name: '2× Upscale',
    description: 'Upscale images 2× with quality enhancement (up to 2048px)',
    price: '$0.05',
    icon: '🔍',
  },
  {
    id: 'favicon',
    name: 'Favicon Generator',
    description: 'Generate multi-size favicons from 16px to 512px + ICO format',
    price: '$0.03',
    icon: '⭐',
  },
  {
    id: 'urlsum',
    name: 'URL Summarizer',
    description: 'Extract and summarize webpage content with key entities',
    price: '$0.03',
    icon: '📄',
  },
  {
    id: 'pdf2txt',
    name: 'PDF to Text',
    description: 'Extract text from PDF documents (up to 10MB)',
    price: '$0.04',
    icon: '📑',
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function ProductGrid() {
  return (
    <section id="products" className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary/30">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4">Micro-utilities</h2>
          <p className="text-lg text-muted-foreground">
            Pay only for what you use. No subscriptions. No accounts.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {products.map((product) => (
            <motion.div key={product.id} variants={item}>
              <ProductCard {...product} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

