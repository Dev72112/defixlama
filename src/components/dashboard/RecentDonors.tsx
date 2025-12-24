import { Gift } from "lucide-react";

interface Donor {
  address: string;
  amount: number;
  token: string;
  timestamp: number;
}

interface RecentDonorsProps {
  donors?: Donor[];
}

export function RecentDonors({ donors = [] }: RecentDonorsProps) {
  // Placeholder donors for demo
  const displayDonors: Donor[] = donors.length > 0 ? donors : [
    { address: "0x1234...5678", amount: 50, token: "USDT", timestamp: Date.now() - 86400000 },
    { address: "0xabcd...efgh", amount: 25, token: "OKB", timestamp: Date.now() - 172800000 },
    { address: "0x9876...5432", amount: 100, token: "USDG", timestamp: Date.now() - 259200000 },
  ];

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  };

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Recent Supporters</h3>
        <Gift className="h-5 w-5 text-primary" />
      </div>

      <div className="space-y-3">
        {displayDonors.map((donor, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-primary-foreground font-bold text-xs">
                {donor.address.slice(2, 4).toUpperCase()}
              </div>
              <div>
                <p className="font-mono text-sm text-foreground">{donor.address}</p>
                <p className="text-xs text-muted-foreground">{formatTime(donor.timestamp)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-success">${donor.amount}</p>
              <p className="text-xs text-muted-foreground">{donor.token}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center mt-4">
        Thank you to all our supporters!
      </p>
    </div>
  );
}
