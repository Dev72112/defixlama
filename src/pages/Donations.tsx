import React from "react";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const DONATION_ADDRESS = "0xde0bcf388d7b1604a2ba30c06ea2fe6e8f4d3662";

const donations = [
  { name: "OKB", symbol: "OKB", address: DONATION_ADDRESS, color: "from-blue-500 to-blue-600" },
  { name: "USDT", symbol: "USDT", address: DONATION_ADDRESS, color: "from-green-500 to-emerald-600" },
  { name: "USDG", symbol: "USDG", address: DONATION_ADDRESS, color: "from-amber-500 to-orange-600" },
];

export default function Donations() {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const handleCopy = (address: string) => {
    try {
      navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (e) {}
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Support the Project</h1>
          <p className="text-muted-foreground">
            Help us build and maintain defiXlama by contributing. All donations support ongoing
            development on XLayer.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {donations.map((token) => (
            <Card
              key={token.symbol}
              className="relative overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50"
            >
              <div
                className={cn(
                  "absolute inset-0 opacity-5 bg-gradient-to-br pointer-events-none",
                  token.color
                )}
              />

              <div className="relative p-6 space-y-4">
                <div className="space-y-2">
                  <div className={cn("inline-block px-3 py-1 rounded-full text-sm font-semibold text-white bg-gradient-to-r", token.color)}>
                    {token.symbol}
                  </div>
                  <h3 className="text-lg font-semibold">{token.name}</h3>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Wallet Address</p>
                  <div className="relative">
                    <code className="block p-3 rounded-md bg-secondary text-xs font-mono break-all text-foreground">{token.address}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => handleCopy(token.address)}
                      title="Copy address"
                    >
                      {copiedAddress === token.address ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">Donations on XLayer network. Please ensure you're sending from/to XLayer compatible wallets.</p>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-8 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Why donate?</h2>
            <ul className="space-y-3 text-sm text-foreground">
              <li className="flex gap-3"><span className="text-primary font-bold">→</span><span>Funds go directly to development and maintenance of defiXlama analytics platform</span></li>
              <li className="flex gap-3"><span className="text-primary font-bold">→</span><span>Help us maintain 24/7 data infrastructure and real-time feeds</span></li>
              <li className="flex gap-3"><span className="text-primary font-bold">→</span><span>Support the XLayer ecosystem by enabling comprehensive DeFi analytics</span></li>
              <li className="flex gap-3"><span className="text-primary font-bold">→</span><span>Every contribution makes XLayer's financial landscape more transparent</span></li>
            </ul>
          </div>
        </Card>

        <Card className="p-8">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">Do I need to use a specific wallet?</h3>
                <p className="text-sm text-muted-foreground">Any XLayer-compatible wallet works (MetaMask, OKX Wallet, etc.). Make sure you're on the XLayer network and sending the correct token type.</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Is there a minimum donation amount?</h3>
                <p className="text-sm text-muted-foreground">No minimum! Any amount helps. Even small contributions are greatly appreciated.</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Can I donate other tokens?</h3>
                <p className="text-sm text-muted-foreground">Right now we accept OKB, USDT, and USDG. For other tokens, please reach out to us on GitHub or Discord.</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Will my donation be acknowledged?</h3>
                <p className="text-sm text-muted-foreground">Major donors will be featured in our community section. All donations are highly appreciated regardless.</p>
              </div>
            </div>
          </div>
        </Card>

        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">Questions about donations? Reach out to the team on GitHub or join our community Discord.</p>
                  <div className="flex gap-3 justify-center">
                      <a href="https://github.com/shadowmystical3-ai/defixlama" target="_blank" rel="noopener noreferrer" className="inline-block">
                        <Button variant="outline">GitHub</Button>
                      </a>
                    </div>
                  </div>
                </div>
              </Layout>
            );
          }
          
 
