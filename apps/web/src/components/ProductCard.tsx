'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  price: string;
  icon: string;
}

export function ProductCard({ id, name, description, price, icon }: ProductCardProps) {
  return (
    <Link href={`/tools/${id}`}>
      <motion.div
        whileHover={{ scale: 1.02, y: -4 }}
        whileTap={{ scale: 0.98 }}
        className="gradient-border p-6 bg-background hover:shadow-xl transition-all duration-300 cursor-pointer group h-full"
      >
        <div className="flex items-start justify-between mb-4">
          <motion.span
            className="text-4xl"
            role="img"
            aria-label={name}
            whileHover={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.5 }}
          >
            {icon}
          </motion.span>
          <span className="text-sm font-bold text-primary">{price}</span>
        </div>

        <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
          {name}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>

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
      </motion.div>
    </Link>
  );
}

