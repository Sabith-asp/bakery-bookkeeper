import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Wallet,
  UserCog,
  ShieldCheck,
  Layers,
  Bell,
  Banknote,
  Package,
  ClipboardList,
  Moon,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

interface NavItemsInput {
  isSuperAdmin: boolean;
  hasModule: (module: string) => boolean;
}

export const getNavItems = ({ isSuperAdmin, hasModule }: NavItemsInput): NavItem[] => {
  return [
    { path: "/", label: "Dashboard", icon: LayoutDashboard, visible: !isSuperAdmin },
    { path: "/income", label: "Income", icon: TrendingUp, visible: hasModule("Income") },
    { path: "/expenses", label: "Expenses", icon: TrendingDown, visible: hasModule("Expenses") },
    { path: "/wages", label: "Wages", icon: Wallet, visible: hasModule("Wages") },
    { path: "/employees", label: "Employees", icon: UserCog, visible: hasModule("Employees") },
    { path: "/divisions", label: "Divisions", icon: Layers, visible: hasModule("Divisions") },
    { path: "/debts", label: "Debts", icon: Banknote, visible: hasModule("Debts") },
    { path: "/inventory", label: "Inventory", icon: Package, visible: hasModule("Inventory") },
    { path: "/tasks", label: "Tasks", icon: ClipboardList, visible: hasModule("Tasks") },
    { path: "/prayer", label: "Prayer", icon: Moon, visible: hasModule("Prayer") },
    { path: "/notifications", label: "Alerts", icon: Bell, visible: hasModule("Notifications") },
    { path: "/admin", label: "Admin", icon: ShieldCheck, visible: isSuperAdmin },
  ]
    .filter((item) => item.visible)
    .map(({ path, label, icon }) => ({ path, label, icon }));
};
