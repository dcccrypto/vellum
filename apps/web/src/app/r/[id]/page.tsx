'use client';

import { use } from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

async function fetchShare(id: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const res = await fetch(`${apiUrl}/share/${encodeURIComponent(id)}`, { cache: 'no-store' });
  return res.json();
}

export default function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const data = use(fetchShare(id));
  const result = data?.result || {};

  const isImage = !!(result.signedUrl || result.imageBase64);
  const isText = !!(result.summary || result.text);

  return (
    <>
      <Navigation />
      <main className="min-h-screen pt-16 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-6">
            <Link href="/tools" className="text-sm text-primary hover:underline">← Back</Link>
          </div>
          <h1 className="text-3xl font-bold mb-2">Shared Result</h1>
          <p className="text-sm text-muted-foreground mb-6">ID: {id}</p>

          {isImage && (
            <div className="rounded border border-border p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.signedUrl || `data:image/png;base64,${result.imageBase64}`}
                alt="Shared result"
                className="max-w-full h-auto rounded"
              />
            </div>
          )}

          {isText && (
            <div className="mt-6 space-y-4">
              {result.summary && (
                <div>
                  <h2 className="text-xl font-semibold mb-2">Summary</h2>
                  <p className="text-sm text-muted-foreground">{result.summary}</p>
                </div>
              )}
              {result.text && (
                <div>
                  <h2 className="text-xl font-semibold mb-2">Text</h2>
                  <pre className="text-xs p-3 bg-secondary/50 border border-border rounded whitespace-pre-wrap">{result.text}</pre>
                </div>
              )}
            </div>
          )}

          {!isImage && !isText && (
            <div className="mt-6">
              <pre className="text-xs p-3 bg-secondary/50 border border-border rounded whitespace-pre-wrap">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}


