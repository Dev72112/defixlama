import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Protocols from "./pages/Protocols";
import ProtocolDetail from "./pages/ProtocolDetail";
import Dexs from "./pages/Dexs";
import DexDetail from "./pages/DexDetail";
import Yields from "./pages/Yields";
import Stablecoins from "./pages/Stablecoins";
import StablecoinDetail from "./pages/StablecoinDetail";
import Tokens from "./pages/Tokens";
import TokenDetail from "./pages/TokenDetail";
import TokenRanking from "./pages/TokenRanking";
import Chains from "./pages/Chains";
import ChainDetail from "./pages/ChainDetail";
import Fees from "./pages/Fees";
import FeeDetail from "./pages/FeeDetail";
import Activities from "./pages/Activities";
import Security from "./pages/Security";
import SecurityDetail from "./pages/SecurityDetail";
import NotFound from "./pages/NotFound";
import Donations from "./pages/Donations";
import Docs from "./pages/Docs";
import Portfolio from "./pages/Portfolio";
import Alerts from "./pages/Alerts";
import BuilderLogs from "./pages/BuilderLogs";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 1000,
      refetchOnWindowFocus: true,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
