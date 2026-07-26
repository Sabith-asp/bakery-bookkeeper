import { useState, lazy, Suspense } from "react";
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
import LottieLoader from "@/components/LottieLoader";

const LoginPage                = lazy(() => import("@/pages/LoginPage"));
const DashboardPage            = lazy(() => import("@/pages/DashboardPage"));
const IncomePage               = lazy(() => import("@/pages/IncomePage"));
const AddIncomePage            = lazy(() => import("@/pages/AddIncomePage"));
const ExpensePage              = lazy(() => import("@/pages/ExpensePage"));
const AddExpensePage           = lazy(() => import("@/pages/AddExpensePage"));
const WagePage                 = lazy(() => import("@/pages/WagePage"));
const AddWagePage              = lazy(() => import("@/pages/AddWagePage"));
const EmployeesPage            = lazy(() => import("@/pages/EmployeesPage"));
const EmployeeWagePage         = lazy(() => import("@/pages/EmployeeWagePage"));
const DivisionsPage            = lazy(() => import("@/pages/DivisionsPage"));
const NotificationSettingsPage = lazy(() => import("@/pages/NotificationSettingsPage"));
const DebtPage                 = lazy(() => import("@/pages/DebtPage"));
const AddDebtPage              = lazy(() => import("@/pages/AddDebtPage"));
const DebtDetailPage           = lazy(() => import("@/pages/DebtDetailPage"));
const AdminDashboardPage       = lazy(() => import("@/pages/admin/AdminDashboardPage"));
const CreateOrganizationPage   = lazy(() => import("@/pages/admin/CreateOrganizationPage"));
const OrganizationDetailPage   = lazy(() => import("@/pages/admin/OrganizationDetailPage"));
const InventoryPage            = lazy(() => import("@/pages/inventory/InventoryPage"));
const AddProductPage           = lazy(() => import("@/pages/inventory/AddProductPage"));
const AddTransactionPage       = lazy(() => import("@/pages/inventory/AddTransactionPage"));
const TasksPage                = lazy(() => import("@/pages/tasks/TasksPage"));
const AddTaskPage              = lazy(() => import("@/pages/tasks/AddTaskPage"));
const TaskDetailPage           = lazy(() => import("@/pages/tasks/TaskDetailPage"));
const PrayerDashboardPage      = lazy(() => import("@/pages/prayer/PrayerDashboardPage"));
const PrayerHistoryPage        = lazy(() => import("@/pages/prayer/PrayerHistoryPage"));
const PrayerSettingsPage       = lazy(() => import("@/pages/prayer/PrayerSettingsPage"));
const MorePage                 = lazy(() => import("@/pages/MorePage"));
const ExpenseTemplatesPage     = lazy(() => import("@/pages/ExpenseTemplatesPage"));
const NotFound                 = lazy(() => import("./pages/NotFound"));


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
          <Suspense fallback={<LottieLoader />}>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />

            {/* Org-user only routes — SuperAdmin is redirected to /admin */}
            <Route path="/"             element={<Org><DashboardPage /></Org>} />

            <Route path="/income"       element={<Mod module="Income"><IncomePage /></Mod>} />
            <Route path="/income/add"   element={<Mod module="Income"><AddIncomePage /></Mod>} />
            <Route path="/income/edit"  element={<Mod module="Income"><AddIncomePage /></Mod>} />

            <Route path="/expenses"           element={<Mod module="Expenses"><ExpensePage /></Mod>} />
            <Route path="/expenses/add"       element={<Mod module="Expenses"><AddExpensePage /></Mod>} />
            <Route path="/expenses/edit"      element={<Mod module="Expenses"><AddExpensePage /></Mod>} />
            <Route path="/expenses/templates" element={<Mod module="Expenses"><ExpenseTemplatesPage /></Mod>} />

            <Route path="/wages"        element={<Mod module="Wages"><WagePage /></Mod>} />
            <Route path="/wages/add"    element={<Mod module="Wages"><AddWagePage /></Mod>} />
            <Route path="/wages/edit"   element={<Mod module="Wages"><AddWagePage /></Mod>} />

            <Route path="/employees"              element={<Mod module="Employees"><EmployeesPage /></Mod>} />
            <Route path="/employees/:id/wages"    element={<Mod module="Employees"><EmployeeWagePage /></Mod>} />

            <Route path="/divisions"              element={<Mod module="Divisions"><DivisionsPage /></Mod>} />
            <Route path="/notifications"          element={<Mod module="Notifications"><NotificationSettingsPage /></Mod>} />

            <Route path="/debts"         element={<Mod module="Debts"><DebtPage /></Mod>} />
            <Route path="/debts/add"     element={<Mod module="Debts"><AddDebtPage /></Mod>} />
            <Route path="/debts/edit"    element={<Mod module="Debts"><AddDebtPage /></Mod>} />
            <Route path="/debts/:id"     element={<Mod module="Debts"><DebtDetailPage /></Mod>} />

            <Route path="/inventory"                    element={<Mod module="Inventory"><InventoryPage /></Mod>} />
            <Route path="/inventory/products/add"       element={<Mod module="Inventory"><AddProductPage /></Mod>} />
            <Route path="/inventory/products/edit"      element={<Mod module="Inventory"><AddProductPage /></Mod>} />
            <Route path="/inventory/transactions/add"   element={<Mod module="Inventory"><AddTransactionPage /></Mod>} />

            <Route path="/tasks"       element={<Mod module="Tasks"><TasksPage /></Mod>} />
            <Route path="/tasks/add"   element={<Mod module="Tasks"><AddTaskPage /></Mod>} />
            <Route path="/tasks/edit"  element={<Mod module="Tasks"><AddTaskPage /></Mod>} />
            <Route path="/tasks/:id"   element={<Mod module="Tasks"><TaskDetailPage /></Mod>} />

            <Route path="/prayer"          element={<Mod module="Prayer"><PrayerDashboardPage /></Mod>} />
            <Route path="/prayer/history"  element={<Mod module="Prayer"><PrayerHistoryPage /></Mod>} />
            <Route path="/prayer/settings" element={<Mod module="Prayer"><PrayerSettingsPage /></Mod>} />

            <Route path="/more"            element={<Org><MorePage /></Org>} />

            {/* SuperAdmin only routes */}
            <Route path="/admin"                      element={<Admin><AdminDashboardPage /></Admin>} />
            <Route path="/admin/organizations/new"    element={<Admin><CreateOrganizationPage /></Admin>} />
            <Route path="/admin/organizations/:id"    element={<Admin><OrganizationDetailPage /></Admin>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
};

export default App;
