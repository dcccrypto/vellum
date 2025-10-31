import { Navigation } from '@/components/Navigation';
import { Hero } from '@/components/Hero';
import { ProductGrid } from '@/components/ProductGrid';
import { HowItWorks } from '@/components/HowItWorks';
import { Footer } from '@/components/Footer';

export default function Home() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen">
        <Hero />
        <ProductGrid />
        <HowItWorks />
        <Footer />
      </main>
    </>
  );
}

