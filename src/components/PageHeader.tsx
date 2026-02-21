import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

const PageHeader = ({ title, subtitle }: PageHeaderProps) => {
  const { logout } = useAuth();

  return (
    <div className="flex items-center justify-between px-4 pt-4 pb-2">
      <div>
        <h1 className="text-xl font-bold font-display text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <Button variant="ghost" size="icon" onClick={logout} className="text-muted-foreground">
        <LogOut className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default PageHeader;
