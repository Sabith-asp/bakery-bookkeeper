import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import IncomePage from "@/pages/IncomePage";
import AddIncomePage from "@/pages/AddIncomePage";
import ExpensePage from "@/pages/ExpensePage";
import AddExpensePage from "@/pages/AddExpensePage";
import WagePage from "@/pages/WagePage";
import AddWagePage from "@/pages/AddWagePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/income" element={<ProtectedRoute><IncomePage /></ProtectedRoute>} />
            <Route path="/income/add" element={<ProtectedRoute><AddIncomePage /></ProtectedRoute>} />
            <Route path="/expenses" element={<ProtectedRoute><ExpensePage /></ProtectedRoute>} />
            <Route path="/expenses/add" element={<ProtectedRoute><AddExpensePage /></ProtectedRoute>} />
            <Route path="/wages" element={<ProtectedRoute><WagePage /></ProtectedRoute>} />
            <Route path="/wages/add" element={<ProtectedRoute><AddWagePage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
