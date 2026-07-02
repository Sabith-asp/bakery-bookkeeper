import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, TrendingUp, TrendingDown, Wallet, UserCog, ShieldCheck, Layers, Bell, Banknote, Package, ClipboardList } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isSuperAdmin, hasModule } = useAuth();

  const navItems = [
    {
      path: "/",
      label: "Dashboard",
      icon: LayoutDashboard,
      visible: !isSuperAdmin,
    },
    {
      path: "/income",
      label: "Income",
      icon: TrendingUp,
      visible: hasModule("Income"),
    },
    {
      path: "/expenses",
      label: "Expenses",
      icon: TrendingDown,
      visible: hasModule("Expenses"),
    },
    {
      path: "/wages",
      label: "Wages",
      icon: Wallet,
      visible: hasModule("Wages"),
    },
    {
      path: "/employees",
      label: "Employees",
      icon: UserCog,
      visible: hasModule("Employees"),
    },
    {
      path: "/divisions",
      label: "Divisions",
      icon: Layers,
      visible: hasModule("Divisions"),
    },
    {
      path: "/debts",
      label: "Debts",
      icon: Banknote,
      visible: hasModule("Debts"),
    },
    {
      path: "/inventory",
      label: "Inventory",
      icon: Package,
      visible: hasModule("Inventory"),
    },
    {
      path: "/tasks",
      label: "Tasks",
      icon: ClipboardList,
      visible: hasModule("Tasks"),
    },
    {
      path: "/notifications",
      label: "Alerts",
      icon: Bell,
      visible: hasModule("Notifications"),
    },
    {
      path: "/admin",
      label: "Admin",
      icon: ShieldCheck,
      visible: isSuperAdmin,
    },
  ].filter((item) => item.visible);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm pb-safe shadow-[0_-1px_0_0_hsl(var(--border))]">
      <div className="mx-auto flex max-w-lg items-center justify-around px-1">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive =
            path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-all ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <span
                className={`flex h-8 w-12 items-center justify-center rounded-full transition-all duration-200 ${
                  isActive ? "bg-primary/10" : ""
                }`}
              >
                <Icon className={`h-[18px] w-[18px] transition-all ${isActive ? "text-primary" : ""}`} />
              </span>
              <span className={isActive ? "text-primary font-semibold" : ""}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
