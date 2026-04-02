import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ChainProvider } from "@/contexts/ChainContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { BackToTopFab } from "@/components/BackToTopFab";
import { lazyLoad } from "@/lib/lazyLoad";
import { CACHE_TIERS } from "@/lib/cacheConfig";

// Eager-load the dashboard for fast initial render
import Dashboard from "./pages/Dashboard";

// Lazy-load all other pages
const Protocols = lazyLoad(() => import("./pages/Protocols"));
const ProtocolDetail = lazyLoad(() => import("./pages/ProtocolDetail"));
const Dexs = lazyLoad(() => import("./pages/Dexs"));
const DexDetail = lazyLoad(() => import("./pages/DexDetail"));
const Yields = lazyLoad(() => import("./pages/Yields"));
const Stablecoins = lazyLoad(() => import("./pages/Stablecoins"));
const StablecoinDetail = lazyLoad(() => import("./pages/StablecoinDetail"));
const Tokens = lazyLoad(() => import("./pages/Tokens"));
const TokenDetail = lazyLoad(() => import("./pages/TokenDetail"));
const Chains = lazyLoad(() => import("./pages/Chains"));
const ChainDetail = lazyLoad(() => import("./pages/ChainDetail"));
const Fees = lazyLoad(() => import("./pages/Fees"));
const FeeDetail = lazyLoad(() => import("./pages/FeeDetail"));
const Activities = lazyLoad(() => import("./pages/Activities"));
const Security = lazyLoad(() => import("./pages/Security"));
const SecurityDetail = lazyLoad(() => import("./pages/SecurityDetail"));
const NotFound = lazyLoad(() => import("./pages/NotFound"));
const Donations = lazyLoad(() => import("./pages/Donations"));
const Docs = lazyLoad(() => import("./pages/Docs"));
const Portfolio = lazyLoad(() => import("./pages/Portfolio"));
const Alerts = lazyLoad(() => import("./pages/Alerts"));
const BuilderLogs = lazyLoad(() => import("./pages/BuilderLogs"));
const Auth = lazyLoad(() => import("./pages/Auth"));
const Admin = lazyLoad(() => import("./pages/Admin"));
const WhaleActivity = lazyLoad(() => import("./pages/WhaleActivity"));
const MarketStructure = lazyLoad(() => import("./pages/MarketStructure"));
const YieldIntelligence = lazyLoad(() => import("./pages/YieldIntelligence"));
const Correlations = lazyLoad(() => import("./pages/Correlations"));

// Premium pages
const Backtester = lazyLoad(() => import("./pages/Backtester"));
const RiskDashboard = lazyLoad(() => import("./pages/RiskDashboard"));
const ApiAccess = lazyLoad(() => import("./pages/ApiAccess"));
const Billing = lazyLoad(() => import("./pages/Billing"));
const AlertConfig = lazyLoad(() => import("./pages/AlertConfig"));
const Predictions = lazyLoad(() => import("./pages/Predictions"));
const ProtocolComparison = lazyLoad(() => import("./pages/ProtocolComparison"));
const GovernancePage = lazyLoad(() => import("./pages/Governance"));
const CommunitySentiment = lazyLoad(() => import("./pages/CommunitySentiment"));
const WatchlistExports = lazyLoad(() => import("./pages/WatchlistExports"));

// Legal pages
const Terms = lazyLoad(() => import("./pages/Terms"));
const Privacy = lazyLoad(() => import("./pages/Privacy"));
const Refunds = lazyLoad(() => import("./pages/Refunds"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      ...CACHE_TIERS.SEMI_STATIC,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
    <ChainProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/protocols" element={<Protocols />} />
            <Route path="/protocols/:slug" element={<ProtocolDetail />} />
            <Route path="/dexs" element={<Dexs />} />
            <Route path="/dexs/:id" element={<DexDetail />} />
            <Route path="/yields" element={<Yields />} />
            <Route path="/stablecoins" element={<Stablecoins />} />
            <Route path="/stablecoins/:id" element={<StablecoinDetail />} />
            <Route path="/tokens" element={<Tokens />} />
            <Route path="/tokens/:id" element={<TokenDetail />} />
            <Route path="/chains" element={<Chains />} />
            <Route path="/chains/:id" element={<ChainDetail />} />
            <Route path="/fees" element={<Fees />} />
            <Route path="/fees/:id" element={<FeeDetail />} />
            <Route path="/activities" element={<Activities />} />
            <Route path="/security" element={<Security />} />
            <Route path="/security/:id" element={<SecurityDetail />} />
            <Route path="/donations" element={<Donations />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/builder-logs" element={<BuilderLogs />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/whale-activity" element={<WhaleActivity />} />
            <Route path="/market-structure" element={<MarketStructure />} />
            <Route path="/yield-intelligence" element={<YieldIntelligence />} />
            <Route path="/correlations" element={<Correlations />} />
            {/* Premium pages */}
            <Route path="/backtester" element={<Backtester />} />
            <Route path="/risk-dashboard" element={<RiskDashboard />} />
            <Route path="/api-access" element={<ApiAccess />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/alert-config" element={<AlertConfig />} />
            <Route path="/predictions" element={<Predictions />} />
            <Route path="/protocol-comparison" element={<ProtocolComparison />} />
            <Route path="/governance" element={<GovernancePage />} />
            <Route path="/community-sentiment" element={<CommunitySentiment />} />
            <Route path="/watchlist-exports" element={<WatchlistExports />} />
            {/* Legal pages */}
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/refunds" element={<Refunds />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <BackToTopFab />
        </BrowserRouter>
      </TooltipProvider>
    </ChainProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
