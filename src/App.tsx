import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Investigations from "./pages/Investigations";
import NewInvestigation from "./pages/NewInvestigation";
import InvestigationDetail from "./pages/InvestigationDetail";
import Documents from "./pages/Documents";
import RiskMatrix from "./pages/RiskMatrix";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/investigations" element={<Investigations />} />
            <Route path="/new-investigation" element={<NewInvestigation />} />
            <Route path="/investigation/:id" element={<InvestigationDetail />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/risk-matrix" element={<RiskMatrix />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
