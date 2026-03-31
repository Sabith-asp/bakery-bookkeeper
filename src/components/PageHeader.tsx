import { useAuth } from "@/context/AuthContext";
import { useDarkMode } from "@/hooks/useDarkMode";
import { Button } from "@/components/ui/button";
import { LogOut, Sun, Moon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

const PageHeader = ({ title, subtitle }: PageHeaderProps) => {
  const { logout } = useAuth();
  const { isDark, toggle } = useDarkMode();

  return (
    <div className="flex items-center justify-between px-4 pt-5 pb-3 border-b border-border/60 bg-card/60 backdrop-blur-sm sticky top-0 z-40">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={logout}
          className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default PageHeader;
