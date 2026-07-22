import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getNavItems } from "@/config/navItems";

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isSuperAdmin, hasModule } = useAuth();

  const navItems = getNavItems({ isSuperAdmin, hasModule });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm pb-safe shadow-[0_-1px_0_0_hsl(var(--border))] md:hidden">
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
                className={`flex h-11 w-11 items-center justify-center rounded-full transition-all duration-200 ${
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
