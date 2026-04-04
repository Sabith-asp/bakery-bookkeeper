import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/api/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, CheckCircle2, XCircle, Plus, Trash2, UserCircle2, Check, X, Layers, Bell } from "lucide-react";
import { useState } from "react";
import type { OrgUser } from "@/types";

const ALL_MODULES = ["Income", "Expenses", "Wages", "Employees", "Divisions", "Notifications"] as const;
type Module = (typeof ALL_MODULES)[number];

const MODULE_DESCRIPTIONS: Record<Module, string> = {
  Income:        "Track all revenue and incoming payments",
  Expenses:      "Track all outgoing expenses by category",
  Wages:         "Manage employee wage payments",
  Employees:     "Manage the employee roster",
  Divisions:     "Organise records by division (e.g. Home, Office)",
  Notifications: "Push notification reminders and budget alerts",
};

const ROLES = [
  { id: 3, label: "Member" },
  { id: 2, label: "OrgAdmin" },
];

const OrganizationDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [statusDialogOpen, setStatusDialogOpen]   = useState(false);
  const [pendingDeleteUser, setPendingDeleteUser]  = useState<OrgUser | null>(null);
  const [showAddUser, setShowAddUser]              = useState(false);
  const [newUsername, setNewUsername]              = useState("");
  const [newPassword, setNewPassword]              = useState("");
  const [newRoleId, setNewRoleId]                  = useState(3);

  // ── Queries ───────────────────────────────────────────────────────────────

  const { data: org, isLoading: orgLoading } = useQuery({
    queryKey: ["admin-organization", id],
    queryFn: () => adminApi.getOrganization(id!),
    enabled: !!id,
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["admin-org-users", id],
    queryFn: () => adminApi.getOrgUsers(id!),
    enabled: !!id,
  });

  const { data: divisions = [], isLoading: divisionsLoading } = useQuery({
    queryKey: ["admin-org-divisions", id],
    queryFn: () => adminApi.getOrgDivisions(id!),
    enabled: !!id,
  });

  const { data: notifData } = useQuery({
    queryKey: ["admin-org-notifications", id],
    queryFn: () => adminApi.getOrgNotifications(id!),
    enabled: !!id && !!org?.enabledModules.includes("Notifications"),
  });

  // ── Mutations ─────────────────────────────────────────────────────────────

  const toggleModuleMutation = useMutation({
    mutationFn: ({ module, enabled }: { module: string; enabled: boolean }) =>
      adminApi.toggleModule(id!, module, enabled),
    onSuccess: (_, { module, enabled }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-organization", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-organizations"] });
      toast({ title: enabled ? "Module enabled" : "Module disabled",
               description: `${module} ${enabled ? "enabled" : "disabled"} for ${org?.name}.` });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.response?.data?.message || "Failed to update module", variant: "destructive" });
    },
  });

  const statusMutation = useMutation({
    mutationFn: (isActive: boolean) => adminApi.setOrgStatus(id!, isActive),
    onSuccess: (_, isActive) => {
      queryClient.invalidateQueries({ queryKey: ["admin-organization", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-organizations"] });
      toast({ title: isActive ? "Organization activated" : "Organization suspended" });
      setStatusDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.response?.data?.message || "Failed to update status", variant: "destructive" });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: () =>
      adminApi.createOrgUser(id!, { username: newUsername.trim(), password: newPassword, roleId: newRoleId }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["admin-org-users", id] });
      toast({ title: "User created", description: `${created.username} (${created.role}) added.` });
      setShowAddUser(false);
      setNewUsername("");
      setNewPassword("");
      setNewRoleId(3);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.response?.data?.message || "Failed to create user", variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => adminApi.deleteOrgUser(id!, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-org-users", id] });
      toast({ title: "User removed" });
      setPendingDeleteUser(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.response?.data?.message || "Failed to remove user", variant: "destructive" });
    },
  });

  const handleAddUser = () => {
    if (!newUsername.trim()) {
      toast({ title: "Error", description: "Username is required.", variant: "destructive" }); return;
    }
    if (!newPassword) {
      toast({ title: "Error", description: "Password is required.", variant: "destructive" }); return;
    }
    createUserMutation.mutate();
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (orgLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Organization not found.</p>
        <Button variant="outline" onClick={() => navigate("/admin")}>Back to Admin</Button>
      </div>
    );
  }

  const isBusy = toggleModuleMutation.isPending || statusMutation.isPending;

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title={org.name} subtitle={`/${org.slug}`} />

      <div className="space-y-4 px-4 pt-2">

        {/* Back */}
        <button
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => navigate("/admin")}
        >
          <ArrowLeft className="h-4 w-4" /> All Organizations
        </button>

        {/* Status card */}
        <Card className={`shadow-sm border ${org.isActive ? "border-green-500/30 bg-green-500/5" : "border-destructive/30 bg-destructive/5"}`}>
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-2">
              {org.isActive
                ? <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                : <XCircle className="h-5 w-5 text-destructive shrink-0" />}
              <div>
                <p className="text-sm font-semibold text-foreground">{org.isActive ? "Active" : "Suspended"}</p>
                <p className="text-xs text-muted-foreground">
                  {org.isActive ? "Users can log in and access this organization." : "All users are blocked from logging in."}
                </p>
              </div>
            </div>
            <Button size="sm" variant={org.isActive ? "destructive" : "default"}
              onClick={() => setStatusDialogOpen(true)} disabled={isBusy}>
              {org.isActive ? "Suspend" : "Activate"}
            </Button>
          </CardContent>
        </Card>

        {/* Users */}
        <div>
          <h2 className="mb-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Users ({users.length})
          </h2>

          {/* Add user form */}
          {showAddUser ? (
            <Card className="mb-2 shadow-sm">
              <CardContent className="pt-4 pb-4 space-y-3">
                <Input
                  placeholder="Username"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  maxLength={100}
                  disabled={createUserMutation.isPending}
                  autoFocus
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={createUserMutation.isPending}
                />
                <div className="flex gap-2">
                  {ROLES.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setNewRoleId(r.id)}
                      className={`flex-1 rounded-lg border py-2 text-xs font-medium transition-colors ${
                        newRoleId === r.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={handleAddUser} disabled={createUserMutation.isPending}>
                    <Check className="mr-1.5 h-3.5 w-3.5" />
                    {createUserMutation.isPending ? "Creating..." : "Create User"}
                  </Button>
                  <Button size="sm" variant="ghost" className="flex-1"
                    onClick={() => { setShowAddUser(false); setNewUsername(""); setNewPassword(""); setNewRoleId(3); }}
                    disabled={createUserMutation.isPending}>
                    <X className="mr-1.5 h-3.5 w-3.5" /> Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Button variant="outline" size="sm" className="w-full mb-2" onClick={() => setShowAddUser(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add User
            </Button>
          )}

          <Card className="shadow-sm">
            <CardContent className="divide-y divide-border py-0">
              {usersLoading ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Loading users...</p>
              ) : users.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No users yet — add one above so this organization can log in.
                </p>
              ) : (
                users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between py-3 px-1 -mx-1">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <UserCircle2 className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{user.username}</p>
                        <p className="text-xs text-muted-foreground">{user.role}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost" size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setPendingDeleteUser(user)}
                      disabled={deleteUserMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Module toggles */}
        <div>
          <h2 className="mb-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Module Access
          </h2>
          <Card className="shadow-sm">
            <CardContent className="divide-y divide-border py-0">
              {ALL_MODULES.map((module) => {
                const isEnabled = org.enabledModules.includes(module);
                return (
                  <div key={module} className="py-3.5 px-1 -mx-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{module}</p>
                        <p className="text-xs text-muted-foreground">{MODULE_DESCRIPTIONS[module]}</p>
                      </div>
                      <button
                        onClick={() => toggleModuleMutation.mutate({ module, enabled: !isEnabled })}
                        disabled={isBusy}
                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${
                          isEnabled ? "bg-primary" : "bg-input"
                        }`}
                        role="switch"
                        aria-checked={isEnabled}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                          isEnabled ? "translate-x-6" : "translate-x-1"
                        }`} />
                      </button>
                    </div>
                    {module === "Divisions" && isEnabled && (
                      <div className="mt-2.5 space-y-1">
                        {divisionsLoading ? (
                          <p className="text-xs text-muted-foreground">Loading...</p>
                        ) : divisions.length === 0 ? (
                          <p className="text-xs text-muted-foreground">No divisions created yet</p>
                        ) : (
                          divisions.map((d) => (
                            <div key={d.id} className="flex items-center gap-2">
                              <Layers className="h-3 w-3 text-primary shrink-0" />
                              <span className="text-xs text-foreground">{d.name}</span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                    {module === "Notifications" && isEnabled && notifData && (
                      <div className="mt-2.5 flex flex-wrap gap-3">
                        <div className="flex items-center gap-1.5">
                          <Bell className="h-3 w-3 text-primary shrink-0" />
                          <span className="text-xs text-foreground">{notifData.subscriptionCount} device{notifData.subscriptionCount !== 1 ? "s" : ""} subscribed</span>
                        </div>
                        {notifData.settings?.dailyReminderEnabled && (
                          <span className="text-xs text-muted-foreground">Daily reminder on</span>
                        )}
                        {notifData.settings?.weeklySummaryEnabled && (
                          <span className="text-xs text-muted-foreground">Weekly summary on</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Meta info */}
        <Card className="shadow-sm">
          <CardContent className="py-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Slug</span>
              <span className="text-xs font-mono text-foreground">{org.slug}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Created</span>
              <span className="text-xs text-foreground">
                {new Date(org.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Active modules</span>
              <span className="text-xs text-foreground">{org.enabledModules.length} / {ALL_MODULES.length}</span>
            </div>
            {org.enabledModules.includes("Divisions") && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Divisions created</span>
                <span className="text-xs text-foreground">{divisions.length}</span>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      <BottomNav />

      {/* Suspend / Activate confirmation */}
      <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{org.isActive ? "Suspend Organization?" : "Activate Organization?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {org.isActive
                ? `All users of "${org.name}" will be blocked from logging in until you reactivate it.`
                : `Users of "${org.name}" will be able to log in again.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={statusMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={org.isActive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
              onClick={() => statusMutation.mutate(!org.isActive)}
              disabled={statusMutation.isPending}
            >
              {statusMutation.isPending ? "Please wait..." : org.isActive ? "Suspend" : "Activate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete user confirmation */}
      <AlertDialog open={!!pendingDeleteUser} onOpenChange={(open) => { if (!open) setPendingDeleteUser(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove User?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{pendingDeleteUser?.username}</strong> will be permanently deleted and can no longer log in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteUserMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteUserMutation.mutate(pendingDeleteUser!.id)}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};

export default OrganizationDetailPage;
