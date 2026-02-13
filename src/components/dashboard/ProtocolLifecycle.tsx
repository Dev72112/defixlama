import { useMemo } from "react";
import { formatCurrency } from "@/lib/api/defillama";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface Protocol {
  tvl?: number;
  listedAt?: number;
}

interface Props {
  protocols: Protocol[];
  loading?: boolean;
}

const COHORT_COLORS = ["hsl(142, 76%, 46%)", "hsl(180, 80%, 45%)", "hsl(45, 100%, 50%)", "hsl(280, 80%, 60%)"];

export function ProtocolLifecycle({ protocols, loading }: Props) {
  const cohorts = useMemo(() => {
    const now = Date.now() / 1000;
    const buckets = [
      { label: "<30d", maxAge: 30 * 86400, tvl: 0, count: 0 },
      { label: "30-90d", maxAge: 90 * 86400, tvl: 0, count: 0 },
      { label: "90d-1y", maxAge: 365 * 86400, tvl: 0, count: 0 },
      { label: ">1y", maxAge: Infinity, tvl: 0, count: 0 },
    ];
    for (const p of protocols) {
      if (!p.listedAt || !p.tvl) continue;
      const age = now - p.listedAt;
      for (const b of buckets) {
        if (age <= b.maxAge) {
          b.tvl += p.tvl;
          b.count += 1;
          break;
        }
      }
    }
    return buckets.map((b) => ({ name: b.label, tvl: b.tvl, count: b.count }));
  }, [protocols]);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-base font-semibold text-foreground mb-1">Protocol Lifecycle Distribution</h3>
      <p className="text-xs text-muted-foreground mb-3">TVL by protocol age — reveals ecosystem maturity</p>
      {loading ? (
        <div className="skeleton h-[200px] w-full rounded-lg" />
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={cohorts} margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fill: "hsl(0,0%,50%)", fontSize: 11 }} />
            <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fill: "hsl(0,0%,50%)", fontSize: 11 }} />
            <Tooltip
              formatter={(v: number, _: any, entry: any) => [
                `${formatCurrency(v)} (${entry.payload.count} protocols)`,
                "TVL",
              ]}
              contentStyle={{
                backgroundColor: "hsl(0 0% 3%)",
                border: "1px solid hsl(0 0% 8%)",
                borderRadius: "8px",
                color: "hsl(0 0% 93%)",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="tvl" radius={[4, 4, 0, 0]}>
              {cohorts.map((_, i) => (
                <Cell key={i} fill={COHORT_COLORS[i]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
