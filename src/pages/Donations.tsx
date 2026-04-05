import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, Heart } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const DONATION_ADDRESS = "0xde0bcf388d7b1604a2ba30c06ea2fe6e8f4d3662";

const tokens = [
  { name: "OKB", symbol: "OKB", address: DONATION_ADDRESS, color: "from-blue-500 to-blue-600" },
  { name: "USDT", symbol: "USDT", address: DONATION_ADDRESS, color: "from-green-500 to-emerald-600" },
  { name: "USDG", symbol: "USDG", address: DONATION_ADDRESS, color: "from-amber-500 to-orange-600" },
];

export default function Donations() {
  const { t } = useTranslation();
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
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto">
            <Heart className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">{t('donations.title', 'Support DefiXlama')}</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            {t('donations.subtitle', 'Help us keep the platform free and open. Donations go towards server costs, API subscriptions, and development.')}
          </p>
        </div>

        {/* Donation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {tokens.map((token) => (
            <Card key={token.symbol} className="relative overflow-hidden">
              <div className={cn("absolute inset-0 opacity-5 bg-gradient-to-br pointer-events-none", token.color)} />
              <div className="relative p-5 space-y-3">
                <div className={cn("inline-block px-3 py-1 rounded-full text-sm font-semibold text-white bg-gradient-to-r", token.color)}>
                  {token.symbol}
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {t('donations.walletAddress', 'Wallet Address')}
                  </p>
                  <div className="relative">
                    <code className="block p-2.5 rounded-md bg-secondary text-[10px] font-mono break-all text-foreground leading-relaxed">
                      {token.address}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                      onClick={() => handleCopy(token.address)}
                    >
                      {copiedAddress === token.address ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {t('donations.xlayerNetworkNote', 'Send on X Layer network only')}
                </p>
              </div>
            </Card>
          ))}
        </div>

        {/* Why Donate */}
        <Card className="p-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <h2 className="text-lg font-semibold mb-3">{t('donations.whyDonate', 'Why Donate?')}</h2>
          <ul className="space-y-2 text-sm text-foreground">
            <li className="flex gap-2"><span className="text-primary">→</span>{t('donations.reason1', 'Keep the platform free for everyone')}</li>
            <li className="flex gap-2"><span className="text-primary">→</span>{t('donations.reason2', 'Fund premium API subscriptions and data feeds')}</li>
            <li className="flex gap-2"><span className="text-primary">→</span>{t('donations.reason3', 'Support ongoing development and new features')}</li>
            <li className="flex gap-2"><span className="text-primary">→</span>{t('donations.reason4', 'Help cover server and infrastructure costs')}</li>
          </ul>
        </Card>

        {/* FAQ */}
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">{t('donations.faq', 'FAQ')}</h2>
          {[
            { q: t('donations.faq1Question', 'Which network should I use?'), a: t('donations.faq1Answer', 'Please send tokens on the X Layer network only.') },
            { q: t('donations.faq2Question', 'Are donations tax deductible?'), a: t('donations.faq2Answer', 'We are not a registered non-profit, so donations are not tax deductible.') },
            { q: t('donations.faq3Question', 'Can I donate other tokens?'), a: t('donations.faq3Answer', 'We currently accept OKB, USDT, and USDG on X Layer.') },
          ].map(({ q, a }) => (
            <div key={q} className="space-y-1">
              <h3 className="font-medium text-sm">{q}</h3>
              <p className="text-sm text-muted-foreground">{a}</p>
            </div>
          ))}
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Thank you for supporting the DeFi community ❤️
        </p>
      </div>
    </Layout>
  );
}
