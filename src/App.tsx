import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ChainProvider } from "@/contexts/ChainContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { lazyLoad } from "@/lib/lazyLoad";
import { QUERY_CLIENT_DEFAULT_OPTIONS } from "@/lib/cacheConfig";

// Lazy load all page components for code splitting
const Dashboard = lazyLoad(() => import("./pages/Dashboard"));
const Auth = lazyLoad(() => import("./pages/Auth"));
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
const Donations = lazyLoad(() => import("./pages/Donations"));
const Docs = lazyLoad(() => import("./pages/Docs"));
const Portfolio = lazyLoad(() => import("./pages/Portfolio"));
const Alerts = lazyLoad(() => import("./pages/Alerts"));
const BuilderLogs = lazyLoad(() => import("./pages/BuilderLogs"));
const Admin = lazyLoad(() => import("./pages/Admin"));
const WhaleActivity = lazyLoad(() => import("./pages/WhaleActivity"));
const MarketStructure = lazyLoad(() => import("./pages/MarketStructure"));
const YieldIntelligence = lazyLoad(() => import("./pages/YieldIntelligence"));
const Correlations = lazyLoad(() => import("./pages/Correlations"));
const RiskDashboard = lazyLoad(() => import("./pages/RiskDashboard"));
const AlertsConfig = lazyLoad(() => import("./pages/AlertsConfig"));
const APIAccess = lazyLoad(() => import("./pages/APIAccess"));
const Backtester = lazyLoad(() => import("./pages/Backtester"));
const Predictions = lazyLoad(() => import("./pages/Predictions"));
const ProtocolComparison = lazyLoad(() => import("./pages/ProtocolComparison"));
const GovernanceTracker = lazyLoad(() => import("./pages/GovernanceTracker"));
const CommunitySentiment = lazyLoad(() => import("./pages/CommunitySentiment"));
const WatchlistExports = lazyLoad(() => import("./pages/WatchlistExports"));
const NotFound = lazyLoad(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: QUERY_CLIENT_DEFAULT_OPTIONS,
});

const App = () => (
  <ErrorBoundary context="App Root">
    <QueryClientProvider client={queryClient}>
      <ChainProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<ErrorBoundary context="Dashboard"><Dashboard /></ErrorBoundary>} />
              <Route path="/auth" element={<ErrorBoundary context="Auth"><Auth /></ErrorBoundary>} />

              {/* Analytics Routes */}
              <Route path="/protocols" element={<ErrorBoundary context="Protocols"><Protocols /></ErrorBoundary>} />
              <Route path="/protocols/:slug" element={<ErrorBoundary context="Protocol Detail"><ProtocolDetail /></ErrorBoundary>} />
              <Route path="/dexs" element={<ErrorBoundary context="DEXs"><Dexs /></ErrorBoundary>} />
              <Route path="/dexs/:id" element={<ErrorBoundary context="DEX Detail"><DexDetail /></ErrorBoundary>} />
              <Route path="/yields" element={<ErrorBoundary context="Yields"><Yields /></ErrorBoundary>} />
              <Route path="/stablecoins" element={<ErrorBoundary context="Stablecoins"><Stablecoins /></ErrorBoundary>} />
              <Route path="/stablecoins/:id" element={<ErrorBoundary context="Stablecoin Detail"><StablecoinDetail /></ErrorBoundary>} />
              <Route path="/tokens" element={<ErrorBoundary context="Tokens"><Tokens /></ErrorBoundary>} />
              <Route path="/tokens/:id" element={<ErrorBoundary context="Token Detail"><TokenDetail /></ErrorBoundary>} />
              <Route path="/chains" element={<ErrorBoundary context="Chains"><Chains /></ErrorBoundary>} />
              <Route path="/chains/:id" element={<ErrorBoundary context="Chain Detail"><ChainDetail /></ErrorBoundary>} />
              <Route path="/fees" element={<ErrorBoundary context="Fees"><Fees /></ErrorBoundary>} />
              <Route path="/fees/:id" element={<ErrorBoundary context="Fee Detail"><FeeDetail /></ErrorBoundary>} />
              <Route path="/security" element={<ErrorBoundary context="Security"><Security /></ErrorBoundary>} />
              <Route path="/security/:id" element={<ErrorBoundary context="Security Detail"><SecurityDetail /></ErrorBoundary>} />

              {/* Premium Routes */}
              <Route path="/portfolio" element={<ErrorBoundary context="Portfolio"><Portfolio /></ErrorBoundary>} />
              <Route path="/alerts" element={<ErrorBoundary context="Alerts"><Alerts /></ErrorBoundary>} />
              <Route path="/alert-config" element={<ErrorBoundary context="Alerts Config"><AlertsConfig /></ErrorBoundary>} />
              <Route path="/backtester" element={<ErrorBoundary context="Backtester"><Backtester /></ErrorBoundary>} />
              <Route path="/predictions" element={<ErrorBoundary context="Predictions"><Predictions /></ErrorBoundary>} />
              <Route path="/protocol-comparison" element={<ErrorBoundary context="Protocol Comparison"><ProtocolComparison /></ErrorBoundary>} />
              <Route path="/governance" element={<ErrorBoundary context="Governance Tracker"><GovernanceTracker /></ErrorBoundary>} />
              <Route path="/risk-dashboard" element={<ErrorBoundary context="Risk Dashboard"><RiskDashboard /></ErrorBoundary>} />
              <Route path="/whale-activity" element={<ErrorBoundary context="Whale Activity"><WhaleActivity /></ErrorBoundary>} />
              <Route path="/market-structure" element={<ErrorBoundary context="Market Structure"><MarketStructure /></ErrorBoundary>} />
              <Route path="/yield-intelligence" element={<ErrorBoundary context="Yield Intelligence"><YieldIntelligence /></ErrorBoundary>} />
              <Route path="/correlations" element={<ErrorBoundary context="Correlations"><Correlations /></ErrorBoundary>} />
              <Route path="/community-sentiment" element={<ErrorBoundary context="Community Sentiment"><CommunitySentiment /></ErrorBoundary>} />
              <Route path="/api-access" element={<ErrorBoundary context="API Access"><APIAccess /></ErrorBoundary>} />
              <Route path="/watchlist-exports" element={<ErrorBoundary context="Watchlist Exports"><WatchlistExports /></ErrorBoundary>} />

              {/* Admin Routes */}
              <Route path="/admin" element={<ErrorBoundary context="Admin Panel"><Admin /></ErrorBoundary>} />
              <Route path="/builder-logs" element={<ErrorBoundary context="Builder Logs"><BuilderLogs /></ErrorBoundary>} />

              {/* Utility Routes */}
              <Route path="/activities" element={<ErrorBoundary context="Activities"><Activities /></ErrorBoundary>} />
              <Route path="/donations" element={<ErrorBoundary context="Donations"><Donations /></ErrorBoundary>} />
              <Route path="/docs" element={<ErrorBoundary context="Documentation"><Docs /></ErrorBoundary>} />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ChainProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
