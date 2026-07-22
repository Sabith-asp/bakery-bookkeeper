import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/api/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import PageShell from "@/components/PageShell";
import { useToast } from "@/hooks/use-toast";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const CreateOrganizationPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
  };

  const handleSlugChange = (value: string) => {
    setSlugTouched(true);
    setSlug(slugify(value));
  };

  const createMutation = useMutation({
    mutationFn: () => adminApi.createOrganization({ name: name.trim(), slug: slug.trim() }),
    onSuccess: (org) => {
      queryClient.invalidateQueries({ queryKey: ["admin-organizations"] });
      toast({ title: "Created", description: `${org.name} has been created.` });
      navigate(`/admin/organizations/${org.id}`);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || "Failed to create organization";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: "Error", description: "Organization name is required", variant: "destructive" });
      return;
    }
    if (!slug.trim()) {
      toast({ title: "Error", description: "Slug is required", variant: "destructive" });
      return;
    }
    createMutation.mutate();
  };

  return (
    <PageShell title="New Organization" subtitle="Create a new tenant">
        <Card className="shadow-sm">
          <CardContent className="pt-5 pb-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Organization Name</label>
                <Input
                  placeholder="e.g. Sunrise Traders"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  maxLength={255}
                  disabled={createMutation.isPending}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Slug</label>
                <Input
                  placeholder="e.g. sunrise-traders"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  maxLength={100}
                  disabled={createMutation.isPending}
                />
                <p className="text-xs text-muted-foreground">
                  URL-safe identifier, auto-generated from name. Only lowercase letters, numbers, and hyphens.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-1">
                <p className="text-xs font-medium text-foreground">Default module access</p>
                <p className="text-xs text-muted-foreground">
                  Income and Expenses are enabled by default. Wages, Employees, Divisions, and Notifications must be toggled on manually after creation.
                </p>
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-11 md:h-10"
                  onClick={() => navigate("/admin")}
                  disabled={createMutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 h-11 md:h-10" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
    </PageShell>
  );
};

export default CreateOrganizationPage;
