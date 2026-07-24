import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import PageShell from "@/components/PageShell";
import EmptyState from "@/components/EmptyState";
import { Bell, ChevronRight, Layers } from "lucide-react";

interface MoreEntry {
  path: string;
  label: string;
  description: string;
  icon: React.ElementType;
}

const MorePage = () => {
  const navigate = useNavigate();
  const { hasModule } = useAuth();

  const entries: MoreEntry[] = [
    {
      path: "/divisions",
      label: "Divisions",
      description: "Manage your organisation's divisions",
      icon: Layers,
      visible: hasModule("Divisions"),
    },
    {
      path: "/notifications",
      label: "Alerts",
      description: "Configure notification preferences",
      icon: Bell,
      visible: hasModule("Notifications"),
    },
  ].filter((e) => e.visible) as MoreEntry[];

  return (
    <PageShell title="More">
      {entries.length === 0 ? (
        <EmptyState message="No additional sections are enabled for your account." />
      ) : (
        <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
          {entries.map(({ path, label, description, icon: Icon }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex w-full items-center gap-4 bg-card px-4 py-4 text-left transition-colors hover:bg-muted/50 active:bg-muted"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}
    </PageShell>
  );
};

export default MorePage;
