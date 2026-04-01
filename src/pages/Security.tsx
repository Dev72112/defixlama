import { Layout } from "@/components/layout/Layout";
import { useChainProtocols } from "@/hooks/useDefiData";
import { useChain } from "@/contexts/ChainContext";
import { Shield, CheckCircle, AlertTriangle, ExternalLink, Search, ChevronLeft, ChevronRight, PieChart, BarChart3 } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link, useSearchParams } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Protocol, formatCurrency } from "@/lib/api/defillama";
import { SecurityOverviewChart } from "@/components/dashboard/SecurityOverviewChart";
import { TVLByAuditChart } from "@/components/dashboard/TVLByAuditChart";
import { ProFeatureTeaser } from "@/components/dashboard/ProFeatureTeaser";

const PAGE_SIZE = 20;

export default function Security() {
  const { t } = useTranslation();
  const { selectedChain } = useChain();
  const { data: protocols, isLoading } = useChainProtocols(selectedChain.id);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [auditFilter, setAuditFilter] = useState<"all" | "audited" | "unaudited">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "overview";
  useEffect(() => { setCurrentPage(1); }, [selectedChain.id]);

  const categories = useMemo(() => {
    if (!protocols) return [];
    const cats = new Set(protocols.map((p) => p.category || "Other"));
    return Array.from(cats).sort();
  }, [protocols]);

  const filteredProtocols = useMemo(() => {
    if (!protocols) return [];
    return protocols.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const isAudited = p.audits && p.audits !== "0";
      const matchesAudit = auditFilter === "all" || 
        (auditFilter === "audited" && isAudited) || 
        (auditFilter === "unaudited" && !isAudited);
      const matchesCategory = categoryFilter === "all" || (p.category || "Other") === categoryFilter;
      return matchesSearch && matchesAudit && matchesCategory;
    });
  }, [protocols, searchQuery, auditFilter, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProtocols.length / PAGE_SIZE));
  const paginatedProtocols = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProtocols.slice(start, start + PAGE_SIZE);
  }, [filteredProtocols, currentPage]);

  useMemo(() => { setCurrentPage(1); }, [searchQuery]);

  const auditedCount = protocols?.filter((p) => p.audits && p.audits !== "0").length || 0;
  const unauditedCount = (protocols?.length || 0) - auditedCount;
  const auditRate = protocols && protocols.length > 0 ? (auditedCount / protocols.length) * 100 : 0;

  // Audit Map data
  const auditByCategory = useMemo(() => {
    if (!protocols) return [];
    const catMap = new Map<string, { audited: number; unaudited: number; auditedTVL: number; unauditedTVL: number }>();
    protocols.forEach(p => {
      const cat = p.category || "Other";
      const isAudited = p.audits && p.audits !== "0";
      const entry = catMap.get(cat) || { audited: 0, unaudited: 0, auditedTVL: 0, unauditedTVL: 0 };
      if (isAudited) { entry.audited++; entry.auditedTVL += p.tvl || 0; }
      else { entry.unaudited++; entry.unauditedTVL += p.tvl || 0; }
      catMap.set(cat, entry);
    });
    return Array.from(catMap.entries())
      .map(([cat, data]) => ({ category: cat, ...data, totalTVL: data.auditedTVL + data.unauditedTVL }))
      .sort((a, b) => b.totalTVL - a.totalTVL);
  }, [protocols]);

  // Risk data
  const highRiskProtocols = useMemo(() => {
    if (!protocols) return [];
    return protocols
      .filter(p => !(p.audits && p.audits !== "0") && p.tvl > 0)
      .sort((a, b) => (b.tvl || 0) - (a.tvl || 0))
      .slice(0, 20);
  }, [protocols]);

  const unauditedTVL = useMemo(() => {
    if (!protocols) return 0;
    return protocols.filter(p => !(p.audits && p.audits !== "0")).reduce((acc, p) => acc + (p.tvl || 0), 0);
  }, [protocols]);

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{selectedChain.name} {t('security.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('security.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4 text-primary" />
            {auditRate.toFixed(0)}% {t('security.auditRate')}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-lg bg-success/10 p-2 text-success"><CheckCircle className="h-5 w-5" /></div>
              <span className="text-sm font-medium text-muted-foreground">{t('security.audited')}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{auditedCount}</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-lg bg-warning/10 p-2 text-warning"><AlertTriangle className="h-5 w-5" /></div>
              <span className="text-sm font-medium text-muted-foreground">{t('security.unaudited')}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{unauditedCount}</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-lg bg-primary/10 p-2 text-primary"><Shield className="h-5 w-5" /></div>
              <span className="text-sm font-medium text-muted-foreground">{t('security.auditRate')}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{auditRate.toFixed(1)}%</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-lg bg-secondary p-2 text-secondary-foreground"><Shield className="h-5 w-5" /></div>
              <span className="text-sm font-medium text-muted-foreground">{t('security.totalProtocols')}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{protocols?.length || 0}</p>
          </div>
        </div>

        <Tabs value={currentTab} onValueChange={(v) => setSearchParams({ tab: v })} className="w-full">
          <div className="overflow-x-auto">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="overview" className="gap-2"><Shield className="h-4 w-4" />Overview</TabsTrigger>
              <TabsTrigger value="audit-map" className="gap-2"><PieChart className="h-4 w-4" />Audit Map</TabsTrigger>
              <TabsTrigger value="risks" className="gap-2"><AlertTriangle className="h-4 w-4" />Risks</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SecurityOverviewChart audited={auditedCount} unaudited={unauditedCount} loading={isLoading} />
              <TVLByAuditChart protocols={filteredProtocols} loading={isLoading} />
            </div>

            <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-foreground">{t('security.securityDisclaimer')}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{t('security.disclaimerText')}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative max-w-md flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder={t('security.searchProtocols')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
              </div>
              <Select value={auditFilter} onValueChange={(v) => setAuditFilter(v as any)}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Audit Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="audited">Audited</SelectItem>
                  <SelectItem value="unaudited">Unaudited</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground ml-auto">
                {t('common.showing')} {paginatedProtocols.length} {t('common.of')} {filteredProtocols.length} {t('common.results')}
              </span>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array(6).fill(0).map((_, i) => (
                  <div key={i} className="rounded-lg border border-border bg-card p-6">
                    <div className="skeleton h-6 w-32 mb-4" />
                    <div className="skeleton h-4 w-24 mb-2" />
                    <div className="skeleton h-4 w-full" />
                  </div>
                ))}
              </div>
            ) : paginatedProtocols.length === 0 ? (
              <div className="rounded-lg border border-border bg-card p-8 text-center">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">{t('security.noProtocolsFound')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paginatedProtocols.map((protocol) => {
                  const slug = (protocol.slug || protocol.name).toLowerCase().replace(/\s+/g, '-');
                  return (
                    <Link to={`/security/${slug}`} key={protocol.id || protocol.name} className="block">
                      <ProtocolSecurityCard protocol={protocol} />
                    </Link>
                  );
                })}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground px-3">{currentPage} / {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            <ProFeatureTeaser
              title="Real-Time Exploit Monitoring"
              description="Get instant alerts when protocols are exploited, with automated risk scoring and fund flow tracking."
              requiredTier="pro"
              icon={<Shield className="h-5 w-5 text-primary/70" />}
              features={["Exploit alert notifications", "Fund flow tracing", "Protocol risk timeline"]}
            />
          </TabsContent>

          <TabsContent value="audit-map" className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="font-semibold text-foreground mb-4">Audit Coverage by Category</h3>
              <p className="text-sm text-muted-foreground mb-4">TVL breakdown showing audited vs unaudited protocols across each category.</p>
              {isLoading ? (
                <div className="space-y-3">{Array(5).fill(0).map((_, i) => <div key={i} className="skeleton h-14 rounded-lg" />)}</div>
              ) : auditByCategory.length === 0 ? (
                <p className="text-muted-foreground text-sm">No data available</p>
              ) : (
                <div className="space-y-3">
                  {auditByCategory.slice(0, 15).map((cat) => {
                    const auditPct = cat.totalTVL > 0 ? (cat.auditedTVL / cat.totalTVL) * 100 : 0;
                    return (
                      <div key={cat.category} className="p-3 rounded-lg bg-muted/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-foreground text-sm">{cat.category}</span>
                          <span className="text-xs text-muted-foreground">
                            {cat.audited} audited / {cat.unaudited} unaudited • {formatCurrency(cat.totalTVL)}
                          </span>
                        </div>
                        <div className="w-full h-3 bg-muted rounded-full overflow-hidden flex">
                          <div className="h-full bg-success rounded-l-full transition-all" style={{ width: `${auditPct}%` }} />
                          <div className="h-full bg-warning/60 rounded-r-full transition-all" style={{ width: `${100 - auditPct}%` }} />
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-success">{auditPct.toFixed(0)}% Audited</span>
                          <span className="text-xs text-warning">{(100 - auditPct).toFixed(0)}% Unaudited</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <ProFeatureTeaser
              title="Smart Contract Risk Scanner"
              description="Deep analysis of smart contract risk factors including code complexity, admin key exposure, and upgrade patterns."
              requiredTier="pro_plus"
              icon={<BarChart3 className="h-5 w-5 text-primary/70" />}
              features={["Contract complexity scoring", "Admin key risk detection", "Upgrade pattern analysis"]}
            />
          </TabsContent>

          <TabsContent value="risks" className="space-y-6">
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-foreground">Unaudited TVL Exposure</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatCurrency(unauditedTVL)} in TVL is held in unaudited protocols — representing potential smart contract risk.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="font-semibold text-foreground mb-4">Highest Risk: Unaudited Protocols by TVL</h3>
              {isLoading ? (
                <div className="space-y-3">{Array(5).fill(0).map((_, i) => <div key={i} className="skeleton h-12 rounded-lg" />)}</div>
              ) : highRiskProtocols.length === 0 ? (
                <p className="text-muted-foreground text-sm">No unaudited protocols found</p>
              ) : (
                <div className="space-y-2">
                  {highRiskProtocols.map((p, i) => (
                    <Link to={`/security/${(p.slug || p.name).toLowerCase().replace(/\s+/g, '-')}`} key={p.name}>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                        <span className="text-muted-foreground font-mono text-sm w-8">{i + 1}</span>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {p.logo ? (
                            <img src={p.logo} alt={p.name} className="h-7 w-7 rounded-full bg-muted flex-shrink-0"
                              onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${p.name}&background=1a1a2e&color=2dd4bf&size=28`; }} />
                          ) : (
                            <div className="h-7 w-7 rounded-full bg-warning/20 flex items-center justify-center text-warning font-bold text-xs flex-shrink-0">
                              {p.name.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate text-sm">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.category || "DeFi"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium text-foreground text-sm">{formatCurrency(p.tvl)}</span>
                          <span className="px-2 py-0.5 rounded-full bg-warning/10 text-warning text-xs font-medium">Unaudited</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <ProFeatureTeaser
              title="Real-Time Exploit Monitoring"
              description="Monitor all unaudited protocols for suspicious activity with automated alert triggers and risk scoring."
              requiredTier="pro"
              icon={<Shield className="h-5 w-5 text-primary/70" />}
              features={["Suspicious transaction detection", "TVL anomaly alerts", "Risk score changes"]}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

function ProtocolSecurityCard({ protocol }: { protocol: Protocol }) {
  const { t } = useTranslation();
  const isAudited = protocol.audits && protocol.audits !== "0";

  return (
    <div className="rounded-lg border border-border bg-card p-4 sm:p-6 card-hover">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 min-w-0">
          {protocol.logo ? (
            <img src={protocol.logo} alt={protocol.name} className="h-10 w-10 rounded-full bg-muted flex-shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${protocol.name}&background=1a1a2e&color=2dd4bf&size=40`; }} />
          ) : (
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold flex-shrink-0">
              {protocol.name.charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">{protocol.name}</h3>
            <p className="text-sm text-muted-foreground">{protocol.category || "DeFi"}</p>
          </div>
        </div>
        <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0",
          isAudited ? "bg-success/10 text-success" : "bg-warning/10 text-warning")}>
          {isAudited ? (<><CheckCircle className="h-3.5 w-3.5" />{t('security.audited')}</>) : (<><AlertTriangle className="h-3.5 w-3.5" />{t('security.unaudited')}</>)}
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">{t('security.tvl')}</span>
          <span className="font-mono font-medium text-foreground">{formatCurrency(protocol.tvl)}</span>
        </div>
        {protocol.audit_note && (
          <div className="pt-2 border-t border-border">
            <p className="text-sm text-muted-foreground">{protocol.audit_note}</p>
          </div>
        )}
        <div className="flex gap-2 pt-2">
          {protocol.url && (
            <a href={protocol.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
              {t('security.website')} <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {protocol.twitter && (
            <a href={`https://twitter.com/${protocol.twitter}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
              Twitter <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}