import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/api/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import { Building2, Plus, CheckCircle2, XCircle, ChevronRight } from "lucide-react";

const MODULE_LABELS: Record<string, string> = {
  Income: "Income",
  Expenses: "Expenses",
  Wages: "Wages",
  Employees: "Employees",
  Divisions: "Divisions",
  Notifications: "Notifications",
};

const AdminDashboardPage = () => {
  const navigate = useNavigate();

  const { data: organizations = [], isLoading } = useQuery({
    queryKey: ["admin-organizations"],
    queryFn: adminApi.getOrganizations,
  });

  const active = organizations.filter((o) => o.isActive).length;
  const suspended = organizations.length - active;

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="Platform Admin" subtitle="Manage organizations" />

      <div className="space-y-4 px-4 pt-2">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2.5">
          <Card className="border-primary/20 bg-primary/5 shadow-sm">
            <CardContent className="py-3 px-3">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Total</p>
              <p className="text-2xl font-bold text-primary mt-0.5">{organizations.length}</p>
            </CardContent>
          </Card>
          <Card className="border-green-500/20 bg-green-500/5 shadow-sm">
            <CardContent className="py-3 px-3">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Active</p>
              <p className="text-2xl font-bold text-green-600 mt-0.5">{active}</p>
            </CardContent>
          </Card>
          <Card className="border-destructive/20 bg-destructive/5 shadow-sm">
            <CardContent className="py-3 px-3">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Suspended</p>
              <p className="text-2xl font-bold text-destructive mt-0.5">{suspended}</p>
            </CardContent>
          </Card>
        </div>

        <Button className="w-full" onClick={() => navigate("/admin/organizations/new")}>
          <Plus className="mr-2 h-4 w-4" /> New Organization
        </Button>

        {/* Organization list */}
        <Card className="shadow-sm">
          <CardContent className="divide-y divide-border py-0">
            {isLoading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Loading organizations...</p>
            ) : organizations.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No organizations yet</p>
            ) : (
              organizations.map((org) => (
                <button
                  key={org.id}
                  className="flex w-full items-center justify-between py-3 px-1 -mx-1 rounded-lg hover:bg-muted/40 transition-colors text-left"
                  onClick={() => navigate(`/admin/organizations/${org.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{org.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {org.isActive ? (
                          <span className="flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle2 className="h-3 w-3" /> Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-destructive">
                            <XCircle className="h-3 w-3" /> Suspended
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">
                          {org.enabledModules
                            .map((m) => MODULE_LABELS[m] ?? m)
                            .join(", ") || "No modules"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default AdminDashboardPage;
