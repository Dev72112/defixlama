import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Protocols from "./pages/Protocols";
import ProtocolDetail from "./pages/ProtocolDetail";
import Dexs from "./pages/Dexs";
import Yields from "./pages/Yields";
import Stablecoins from "./pages/Stablecoins";
import Tokens from "./pages/Tokens";
import TokenDetail from "./pages/TokenDetail";
import Chains from "./pages/Chains";
import Fees from "./pages/Fees";
import Security from "./pages/Security";
import NotFound from "./pages/NotFound";

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
          <Route path="/protocols" element={<Protocols />} />
          <Route path="/protocols/:slug" element={<ProtocolDetail />} />
          <Route path="/dexs" element={<Dexs />} />
          <Route path="/yields" element={<Yields />} />
          <Route path="/stablecoins" element={<Stablecoins />} />
          <Route path="/tokens" element={<Tokens />} />
          <Route path="/tokens/:id" element={<TokenDetail />} />
          <Route path="/chains" element={<Chains />} />
          <Route path="/fees" element={<Fees />} />
          <Route path="/security" element={<Security />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
