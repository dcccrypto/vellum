export function Footer() {
  return (
    <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h3 className="font-bold text-lg mb-2">Vellum</h3>
            <p className="text-sm text-muted-foreground">
              Micro-utility store powered by x402 payments on Solana.
            </p>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-2">Resources</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>
                <a 
                  href="https://github.com/dcccrypto/vellum" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  GitHub Repository
                </a>
              </li>
              <li>
                <a 
                  href="https://docs.cdp.coinbase.com/x402/welcome" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  x402 Documentation
                </a>
              </li>
              <li>
                <a 
                  href="https://docs.payai.network" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  PayAI Facilitator
                </a>
              </li>
              <li>
                <a 
                  href="https://solana.com" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  Solana
                </a>
              </li>
            </ul>
          </div>

          {/* API Endpoint */}
          <div>
            <h4 className="font-semibold mb-2">API Endpoint</h4>
            <code className="text-xs bg-secondary p-2 rounded block">
              POST https://api.vellum.app/x402/pay
            </code>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>Built with Next.js, Inspira UI, and ❤️ for the x402 ecosystem</p>
        </div>
      </div>
    </footer>
  );
}

