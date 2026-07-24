import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Wallet,
  UserCog,
  ShieldCheck,
  Bell,
  Banknote,
  Package,
  ClipboardList,
  Moon,
  MoreHorizontal,
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
  const orgUser = !isSuperAdmin;
  return [
    { path: "/", label: "Dashboard", icon: LayoutDashboard, visible: orgUser },
    { path: "/income", label: "Income", icon: TrendingUp, visible: orgUser && hasModule("Income") },
    { path: "/expenses", label: "Expenses", icon: TrendingDown, visible: orgUser && hasModule("Expenses") },
    { path: "/wages", label: "Wages", icon: Wallet, visible: orgUser && hasModule("Wages") },
    { path: "/employees", label: "Employees", icon: UserCog, visible: orgUser && hasModule("Employees") },
    { path: "/debts", label: "Debts", icon: Banknote, visible: orgUser && hasModule("Debts") },
    { path: "/inventory", label: "Inventory", icon: Package, visible: orgUser && hasModule("Inventory") },
    { path: "/tasks", label: "Tasks", icon: ClipboardList, visible: orgUser && hasModule("Tasks") },
    { path: "/prayer", label: "Prayer", icon: Moon, visible: orgUser && hasModule("Prayer") },
    {
      path: "/more",
      label: "More",
      icon: MoreHorizontal,
      visible: orgUser && (hasModule("Divisions") || hasModule("Notifications")),
    },
    { path: "/admin", label: "Admin", icon: ShieldCheck, visible: isSuperAdmin },
  ]
    .filter((item) => item.visible)
    .map(({ path, label, icon }) => ({ path, label, icon }));
};
