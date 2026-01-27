import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";
import { ChainProvider } from "@/contexts/ChainContext";

// Eagerly load critical pages
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy load other pages for better initial bundle size
const Protocols = lazy(() => import("./pages/Protocols"));
const ProtocolDetail = lazy(() => import("./pages/ProtocolDetail"));
const Dexs = lazy(() => import("./pages/Dexs"));
const DexDetail = lazy(() => import("./pages/DexDetail"));
const Yields = lazy(() => import("./pages/Yields"));
const Stablecoins = lazy(() => import("./pages/Stablecoins"));
const StablecoinDetail = lazy(() => import("./pages/StablecoinDetail"));
const Tokens = lazy(() => import("./pages/Tokens"));
const TokenDetail = lazy(() => import("./pages/TokenDetail"));
const TokenRanking = lazy(() => import("./pages/TokenRanking"));
const Chains = lazy(() => import("./pages/Chains"));
const ChainDetail = lazy(() => import("./pages/ChainDetail"));
const Fees = lazy(() => import("./pages/Fees"));
const FeeDetail = lazy(() => import("./pages/FeeDetail"));
const Activities = lazy(() => import("./pages/Activities"));
const Security = lazy(() => import("./pages/Security"));
const SecurityDetail = lazy(() => import("./pages/SecurityDetail"));
const Donations = lazy(() => import("./pages/Donations"));
const Docs = lazy(() => import("./pages/Docs"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const Alerts = lazy(() => import("./pages/Alerts"));
const BuilderLogs = lazy(() => import("./pages/BuilderLogs"));
const Admin = lazy(() => import("./pages/Admin"));

// Page loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 1000,
      refetchOnWindowFocus: true,
      // Improved caching strategy
      gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
      refetchInterval: 30 * 1000, // Refresh every 30s for live data feel
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ChainProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Eagerly loaded routes */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/auth" element={<Auth />} />
              
              {/* Lazy loaded routes */}
              <Route path="/protocols" element={<Protocols />} />
              <Route path="/protocols/:slug" element={<ProtocolDetail />} />
              <Route path="/dexs" element={<Dexs />} />
              <Route path="/dexs/:id" element={<DexDetail />} />
              <Route path="/yields" element={<Yields />} />
              <Route path="/stablecoins" element={<Stablecoins />} />
              <Route path="/stablecoins/:id" element={<StablecoinDetail />} />
              <Route path="/tokens" element={<Tokens />} />
              <Route path="/tokens/:id" element={<TokenDetail />} />
              <Route path="/token-ranking" element={<TokenRanking />} />
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
              
              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </ChainProvider>
  </QueryClientProvider>
);

export default App;