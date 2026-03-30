import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, TrendingUp, TrendingDown, Wallet, UserCog } from "lucide-react";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/income", label: "Income", icon: TrendingUp },
  { path: "/expenses", label: "Expenses", icon: TrendingDown },
  { path: "/wages", label: "Wages", icon: Wallet },
  { path: "/employees", label: "Employees", icon: UserCog },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm pb-safe shadow-[0_-1px_0_0_hsl(var(--border))]">
      <div className="mx-auto flex max-w-lg items-center justify-around px-1">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-all ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <span className={`flex h-8 w-12 items-center justify-center rounded-full transition-all duration-200 ${
                isActive ? "bg-primary/10" : ""
              }`}>
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
