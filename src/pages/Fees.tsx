import { Layout } from "@/components/layout/Layout";
import { StatCard } from "@/components/dashboard/StatCard";
import { useFeesData } from "@/hooks/useDefiData";
import { formatCurrency } from "@/lib/api/defillama";
import { BarChart3, TrendingUp, Search, DollarSign, Activity } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

export default function Fees() {
  const { data: fees, isLoading } = useFeesData();
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // Filter fees that might be relevant to XLayer
  const filteredFees = useMemo(() => {
              <tbody>
                {filteredFees.map((fee, index) => {
                  const slug = (fee.displayName || fee.name || index).toString().toLowerCase().replace(/\s+/g, '-');
                  return (
                    <tr
                      key={fee.name || index}
                      className="group cursor-pointer"
                      onClick={() => navigate(`/fees/${slug}`)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/fees/${slug}`); }}
                    >
                      <td className="text-muted-foreground font-mono text-sm hidden sm:table-cell">
                        {index + 1}
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          {fee.logo ? (
                            <img
                              src={fee.logo}
                              alt={fee.displayName || fee.name}
                              className="h-8 w-8 rounded-full bg-muted flex-shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${fee.name}&background=1a1a2e&color=2dd4bf&size=32`;
                              }}
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                              {(fee.displayName || fee.name || "?").charAt(0)}
                            </div>
                          )}
                          <span className="font-medium text-foreground truncate max-w-[120px] sm:max-w-none">
                            {fee.displayName || fee.name}
                          </span>
                        </div>
                      </td>
                      <td className="text-right font-mono font-medium text-foreground whitespace-nowrap">
                        {formatCurrency(fee.total24h)}
                      </td>
                      <td className="text-right font-mono text-muted-foreground hidden sm:table-cell whitespace-nowrap">
                        {formatCurrency(fee.total7d)}
                      </td>
                      <td className="text-right whitespace-nowrap">
                        <span
                          className={cn(
                            "font-mono text-sm",
                            (fee.change_1d || 0) >= 0
                              ? "text-success"
                              : "text-destructive"
                          )}
                        >
                          {fee.change_1d !== undefined
                            ? `${fee.change_1d >= 0 ? "+" : ""}${fee.change_1d.toFixed(2)}%`
                            : "-"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            placeholder="Search protocols..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Fees Table */}
        {isLoading ? (
          <div className="rounded-lg border border-border bg-card overflow-x-auto">
            <table className="data-table w-full min-w-[500px]">
              <thead>
                <tr className="bg-muted/30">
                  <th className="w-12 hidden sm:table-cell">#</th>
                  <th>Protocol</th>
                  <th className="text-right">24h Fees</th>
                  <th className="text-right hidden sm:table-cell">7d Fees</th>
                  <th className="text-right">24h Change</th>
                </tr>
              </thead>
              <tbody>
                {Array(10).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="hidden sm:table-cell"><div className="skeleton h-4 w-6" /></td>
                    <td><div className="skeleton h-4 w-32" /></td>
                    <td><div className="skeleton h-4 w-24 ml-auto" /></td>
                    <td className="hidden sm:table-cell"><div className="skeleton h-4 w-24 ml-auto" /></td>
                    <td><div className="skeleton h-4 w-16 ml-auto" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : filteredFees.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No fee data found</p>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-x-auto">
            <table className="data-table w-full min-w-[500px]">
              <thead>
                <tr className="bg-muted/30">
                  <th className="w-12 hidden sm:table-cell">#</th>
                  <th>Protocol</th>
                  <th className="text-right">24h Fees</th>
                  <th className="text-right hidden sm:table-cell">7d Fees</th>
                  <th className="text-right">24h Change</th>
                </tr>
              </thead>
              <tbody>
                {filteredFees.map((fee, index) => {
                  const slug = (fee.displayName || fee.name || index).toString().toLowerCase().replace(/\s+/g, '-');
                  return (
                    <tr
                      key={fee.name || index}
                      className="group cursor-pointer"
                      onClick={() => navigate(`/fees/${slug}`)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/fees/${slug}`); }}
                    >
                  );
                })}
                    <td className="text-muted-foreground font-mono text-sm hidden sm:table-cell">
                      {index + 1}
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        {fee.logo ? (
                          <img
                            src={fee.logo}
                            alt={fee.displayName || fee.name}
                            className="h-8 w-8 rounded-full bg-muted flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${fee.name}&background=1a1a2e&color=2dd4bf&size=32`;
                            }}
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                            {(fee.displayName || fee.name || "?").charAt(0)}
                          </div>
                        )}
                        <span className="font-medium text-foreground truncate max-w-[120px] sm:max-w-none">
                          {fee.displayName || fee.name}
                        </span>
                      </div>
                    </td>
                    <td className="text-right font-mono font-medium text-foreground whitespace-nowrap">
                      {formatCurrency(fee.total24h)}
                    </td>
                    <td className="text-right font-mono text-muted-foreground hidden sm:table-cell whitespace-nowrap">
                      {formatCurrency(fee.total7d)}
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <span
                        className={cn(
                          "font-mono text-sm",
                          (fee.change_1d || 0) >= 0
                            ? "text-success"
                            : "text-destructive"
                        )}
                      >
                        {fee.change_1d !== undefined
                          ? `${fee.change_1d >= 0 ? "+" : ""}${fee.change_1d.toFixed(2)}%`
                          : "-"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Results count */}
        {!isLoading && (
          <p className="text-sm text-muted-foreground">
            Showing {filteredFees.length} protocols
          </p>
        )}
      </div>
    </Layout>
  );
}
