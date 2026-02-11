import { Layout } from "@/components/layout/Layout";
import { useChainProtocols } from "@/hooks/useDefiData";
import { useChain } from "@/contexts/ChainContext";
import { Shield, CheckCircle, AlertTriangle, ExternalLink, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Protocol, formatCurrency } from "@/lib/api/defillama";
import { SecurityOverviewChart } from "@/components/dashboard/SecurityOverviewChart";
import { TVLByAuditChart } from "@/components/dashboard/TVLByAuditChart";

const PAGE_SIZE = 20;

export default function Security() {
  const { t } = useTranslation();
  const { selectedChain } = useChain();
  const { data: protocols, isLoading } = useChainProtocols(selectedChain.id);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter protocols
  const filteredProtocols = useMemo(() => {
    if (!protocols) return [];
    return protocols.filter((p) => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [protocols, searchQuery]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(filteredProtocols.length / PAGE_SIZE));
  const paginatedProtocols = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProtocols.slice(start, start + PAGE_SIZE);
  }, [filteredProtocols, currentPage]);

  // Reset page on search
  useMemo(() => { setCurrentPage(1); }, [searchQuery]);

  // Calculate audit stats
  const auditedCount = protocols?.filter((p) => p.audits && p.audits !== "0").length || 0;
  const unauditedCount = (protocols?.length || 0) - auditedCount;
  const auditRate = protocols && protocols.length > 0 
    ? (auditedCount / protocols.length) * 100 
    : 0;

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
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

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-lg bg-success/10 p-2 text-success">
                <CheckCircle className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">{t('security.audited')}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{auditedCount}</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-lg bg-warning/10 p-2 text-warning">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">{t('security.unaudited')}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{unauditedCount}</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <Shield className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">{t('security.auditRate')}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{auditRate.toFixed(1)}%</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-lg bg-secondary p-2 text-secondary-foreground">
                <Shield className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">{t('security.totalProtocols')}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{protocols?.length || 0}</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SecurityOverviewChart audited={auditedCount} unaudited={unauditedCount} loading={isLoading} />
          <TVLByAuditChart protocols={filteredProtocols} loading={isLoading} />
        </div>

        {/* Security Notice */}
        <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-foreground">{t('security.securityDisclaimer')}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t('security.disclaimerText')}</p>
            </div>
          </div>
        </div>

        {/* Search + Count */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('security.searchProtocols')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <span className="text-sm text-muted-foreground">
            {t('common.showing')} {paginatedProtocols.length} {t('common.of')} {filteredProtocols.length} {t('common.results')}
          </span>
        </div>

        {/* Protocols Grid */}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground px-3">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
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
            <img
              src={protocol.logo}
              alt={protocol.name}
              className="h-10 w-10 rounded-full bg-muted flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${protocol.name}&background=1a1a2e&color=2dd4bf&size=40`;
              }}
            />
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
        <div
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0",
            isAudited
              ? "bg-success/10 text-success"
              : "bg-warning/10 text-warning"
          )}
        >
          {isAudited ? (
            <>
              <CheckCircle className="h-3.5 w-3.5" />
              {t('security.audited')}
            </>
          ) : (
            <>
              <AlertTriangle className="h-3.5 w-3.5" />
              {t('security.unaudited')}
            </>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">{t('security.tvl')}</span>
          <span className="font-mono font-medium text-foreground">
            {formatCurrency(protocol.tvl)}
          </span>
        </div>
        
        {protocol.audit_note && (
          <div className="pt-2 border-t border-border">
            <p className="text-sm text-muted-foreground">{protocol.audit_note}</p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {protocol.url && (
            <a
              href={protocol.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              {t('security.website')} <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {protocol.twitter && (
            <a
              href={`https://twitter.com/${protocol.twitter}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Twitter <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
