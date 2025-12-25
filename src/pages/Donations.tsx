import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, Download } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { DonationStats } from "@/components/dashboard/DonationStats";
import { RecentDonors } from "@/components/dashboard/RecentDonors";
import { DonationLeaderboard } from "@/components/dashboard/DonationLeaderboard";
import { useDonationStats, useDonations } from "@/hooks/useDonations";
import { exportToCSV } from "@/lib/export";
const DONATION_ADDRESS = "0xde0bcf388d7b1604a2ba30c06ea2fe6e8f4d3662";

const donations = [
  { name: "OKB", symbol: "OKB", address: DONATION_ADDRESS, color: "from-blue-500 to-blue-600" },
  { name: "USDT", symbol: "USDT", address: DONATION_ADDRESS, color: "from-green-500 to-emerald-600" },
  { name: "USDG", symbol: "USDG", address: DONATION_ADDRESS, color: "from-amber-500 to-orange-600" },
];

export default function Donations() {
  const { t } = useTranslation();
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const { data: stats } = useDonationStats();
  const { data: allDonations = [] } = useDonations();

  const handleExport = () => {
    if (allDonations.length === 0) return;
    exportToCSV(
      allDonations.map(d => ({
        Address: d.fullAddress,
        Amount: d.amount,
        Token: d.token,
        Date: new Date(d.timestamp).toISOString(),
        TxHash: d.txHash,
      })),
      "donations"
    );
  };
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
          <h1 className="text-3xl font-bold">{t('donations.title')}</h1>
          <p className="text-muted-foreground">
            {t('donations.subtitle')}
          </p>
        </div>

        {/* Stats and Recent Donors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DonationStats 
            totalDonations={stats?.totalDonations || 0} 
            donorCount={stats?.donorCount || 0} 
            monthlyGoal={1000} 
            growthRate={stats?.growthRate || 0} 
          />
          <RecentDonors />
        </div>

        {/* Leaderboard */}
        <DonationLeaderboard />

        {/* Export Button */}
        {allDonations.length > 0 && (
          <div className="flex justify-end">
            <Button variant="outline" onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              {t('donations.exportDonationsCsv')}
            </Button>
          </div>
        )}
        {/* Donation Cards */}
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
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('donations.walletAddress')}</p>
                  <div className="relative">
                    <code className="block p-3 rounded-md bg-secondary text-xs font-mono break-all text-foreground">{token.address}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => handleCopy(token.address)}
                      title={t('donations.copyAddress')}
                    >
                      {copiedAddress === token.address ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">{t('donations.xlayerNetworkNote')}</p>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-8 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">{t('donations.whyDonate')}</h2>
            <ul className="space-y-3 text-sm text-foreground">
              <li className="flex gap-3"><span className="text-primary font-bold">→</span><span>{t('donations.reason1')}</span></li>
              <li className="flex gap-3"><span className="text-primary font-bold">→</span><span>{t('donations.reason2')}</span></li>
              <li className="flex gap-3"><span className="text-primary font-bold">→</span><span>{t('donations.reason3')}</span></li>
              <li className="flex gap-3"><span className="text-primary font-bold">→</span><span>{t('donations.reason4')}</span></li>
            </ul>
          </div>
        </Card>

        <Card className="p-8">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">{t('donations.faq')}</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">{t('donations.faq1Question')}</h3>
                <p className="text-sm text-muted-foreground">{t('donations.faq1Answer')}</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">{t('donations.faq2Question')}</h3>
                <p className="text-sm text-muted-foreground">{t('donations.faq2Answer')}</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">{t('donations.faq3Question')}</h3>
                <p className="text-sm text-muted-foreground">{t('donations.faq3Answer')}</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">{t('donations.faq4Question')}</h3>
                <p className="text-sm text-muted-foreground">{t('donations.faq4Answer')}</p>
              </div>
            </div>
          </div>
        </Card>

        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">{t('donations.questionsAboutDonations')}</p>
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
          
 
