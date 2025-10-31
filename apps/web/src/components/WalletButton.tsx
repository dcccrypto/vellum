'use client';

import dynamic from 'next/dynamic';
import type { FC } from 'react';

// Dynamic import with no SSR to prevent hydration mismatch
export const WalletButton: FC = dynamic(
  async () => {
    const { WalletMultiButton } = await import('@solana/wallet-adapter-react-ui');
    return WalletMultiButton;
  },
  {
    ssr: false,
    loading: () => (
      <button className="px-5 h-[44px] bg-secondary/50 border border-border rounded-lg text-sm font-semibold">
        Loading...
      </button>
    ),
  }
) as any;

