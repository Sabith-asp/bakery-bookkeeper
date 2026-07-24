import { useAuth } from "@/context/AuthContext";
import { useDarkMode } from "@/hooks/useDarkMode";
import { Button } from "@/components/ui/button";
import { LogOut, Sun, Moon, ArrowLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
}

const PageHeader = ({ title, subtitle, onBack }: PageHeaderProps) => {
  const { logout } = useAuth();
  const { isDark, toggle } = useDarkMode();

  return (
    <div className="flex items-center justify-between px-4 md:px-6 lg:px-8 pt-5 pb-3 border-b border-border/60 bg-card/60 backdrop-blur-sm sticky top-0 z-40">
      <div className="flex items-center gap-2 min-w-0">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-9 w-9 shrink-0 rounded-full text-muted-foreground hover:text-foreground -ml-1"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground leading-tight">{title}</h1>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-1.5 md:gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="h-11 w-11 md:h-10 md:w-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={logout}
          className="h-11 w-11 md:h-10 md:w-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default PageHeader;
