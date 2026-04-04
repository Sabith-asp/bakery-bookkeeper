import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import GlobalApiLoader from "@/components/GlobalApiLoader";
import PwaUpdatePrompt from "@/components/PwaUpdatePrompt";
import SplashScreen from "@/components/SplashScreen";
import ProtectedRoute from "@/components/ProtectedRoute";
import OrgRoute from "@/components/OrgRoute";
import ModuleRoute from "@/components/ModuleRoute";
import AdminRoute from "@/components/AdminRoute";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import IncomePage from "@/pages/IncomePage";
import AddIncomePage from "@/pages/AddIncomePage";
import ExpensePage from "@/pages/ExpensePage";
import AddExpensePage from "@/pages/AddExpensePage";
import WagePage from "@/pages/WagePage";
import AddWagePage from "@/pages/AddWagePage";
import EmployeesPage from "@/pages/EmployeesPage";
import EmployeeWagePage from "@/pages/EmployeeWagePage";
import DivisionsPage from "@/pages/DivisionsPage";
import NotificationSettingsPage from "@/pages/NotificationSettingsPage";
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import CreateOrganizationPage from "@/pages/admin/CreateOrganizationPage";
import OrganizationDetailPage from "@/pages/admin/OrganizationDetailPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 300000,
      gcTime: 600000,
      refetchOnWindowFocus: false,
    },
  },
});

// Shorthand wrappers to reduce nesting noise in the route table
const Org = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute><OrgRoute>{children}</OrgRoute></ProtectedRoute>
);

const Mod = ({ module, children }: { module: string; children: React.ReactNode }) => (
  <Org><ModuleRoute module={module}>{children}</ModuleRoute></Org>
);

const Admin = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute><AdminRoute>{children}</AdminRoute></ProtectedRoute>
);

const App = () => {
  const [splashDone, setSplashDone] = useState(false);
  return (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
        <GlobalApiLoader />
        <PwaUpdatePrompt />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />

            {/* Org-user only routes — SuperAdmin is redirected to /admin */}
            <Route path="/"             element={<Org><DashboardPage /></Org>} />

            <Route path="/income"       element={<Mod module="Income"><IncomePage /></Mod>} />
            <Route path="/income/add"   element={<Mod module="Income"><AddIncomePage /></Mod>} />
            <Route path="/income/edit"  element={<Mod module="Income"><AddIncomePage /></Mod>} />

            <Route path="/expenses"     element={<Mod module="Expenses"><ExpensePage /></Mod>} />
            <Route path="/expenses/add" element={<Mod module="Expenses"><AddExpensePage /></Mod>} />
            <Route path="/expenses/edit"element={<Mod module="Expenses"><AddExpensePage /></Mod>} />

            <Route path="/wages"        element={<Mod module="Wages"><WagePage /></Mod>} />
            <Route path="/wages/add"    element={<Mod module="Wages"><AddWagePage /></Mod>} />
            <Route path="/wages/edit"   element={<Mod module="Wages"><AddWagePage /></Mod>} />

            <Route path="/employees"              element={<Mod module="Employees"><EmployeesPage /></Mod>} />
            <Route path="/employees/:id/wages"    element={<Mod module="Employees"><EmployeeWagePage /></Mod>} />

            <Route path="/divisions"              element={<Mod module="Divisions"><DivisionsPage /></Mod>} />
            <Route path="/notifications"          element={<Mod module="Notifications"><NotificationSettingsPage /></Mod>} />

            {/* SuperAdmin only routes */}
            <Route path="/admin"                      element={<Admin><AdminDashboardPage /></Admin>} />
            <Route path="/admin/organizations/new"    element={<Admin><CreateOrganizationPage /></Admin>} />
            <Route path="/admin/organizations/:id"    element={<Admin><OrganizationDetailPage /></Admin>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
};

export default App;
