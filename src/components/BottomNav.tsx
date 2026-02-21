import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, TrendingUp, TrendingDown, Users } from "lucide-react";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/income", label: "Income", icon: TrendingUp },
  { path: "/expenses", label: "Expenses", icon: TrendingDown },
  { path: "/wages", label: "Wages", icon: Users },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card pb-safe">
      <div className="mx-auto flex max-w-lg items-center justify-around">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs transition-colors ${
                isActive
                  ? "text-primary font-semibold"
                  : "text-muted-foreground"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
