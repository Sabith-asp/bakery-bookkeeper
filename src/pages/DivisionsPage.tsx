import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { divisionApi } from "@/api/division";
import type { Division } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { useApiLoading } from "@/state/apiLoading";
import { Plus, Pencil, Trash2, Check, X, Layers } from "lucide-react";
import EmptyState from "@/components/EmptyState";

const DivisionsPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isApiLoading = useApiLoading();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [newName, setNewName] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Division | null>(null);

  const { data: divisions = [], isLoading } = useQuery({
    queryKey: ["division"],
    queryFn: divisionApi.getAll,
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => divisionApi.update(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["division"] });
      setEditingId(null);
      toast({ title: "Saved", description: "Division renamed" });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || "Failed to rename division";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  const addMutation = useMutation({
    mutationFn: divisionApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["division"] });
      setNewName("");
      setShowAdd(false);
      toast({ title: "Added", description: "Division added" });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || "Failed to add division";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: divisionApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["division"] });
      toast({ title: "Deleted", description: "Division removed" });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || "Failed to delete division";
      toast({ title: "Cannot Delete", description: message, variant: "destructive" });
    },
  });

  const startEdit = (division: Division) => {
    setEditingId(division.id);
    setEditName(division.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const saveEdit = () => {
    if (!editName.trim()) {
      toast({ title: "Error", description: "Name cannot be empty", variant: "destructive" });
      return;
    }
    renameMutation.mutate({ id: editingId!, name: editName.trim() });
  };

  const handleAdd = () => {
    if (!newName.trim()) {
      toast({ title: "Error", description: "Enter a division name", variant: "destructive" });
      return;
    }
    addMutation.mutate(newName.trim());
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="Divisions" subtitle="Manage your divisions" />

      <div className="space-y-4 px-4 pt-2">

        {showAdd ? (
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Division name (e.g. Home, Office)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  maxLength={100}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") { setShowAdd(false); setNewName(""); } }}
                  autoFocus
                  disabled={addMutation.isPending}
                />
                <Button size="icon" onClick={handleAdd} disabled={addMutation.isPending}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => { setShowAdd(false); setNewName(""); }} disabled={addMutation.isPending}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Button className="w-full" onClick={() => setShowAdd(true)} disabled={isApiLoading}>
            <Plus className="mr-2 h-4 w-4" /> Add Division
          </Button>
        )}

        <Card className="border-primary/20 bg-primary/5 shadow-sm">
          <CardContent className="py-3">
            <p className="text-xs font-medium text-muted-foreground">Total divisions</p>
            <p className="text-2xl font-bold text-primary mt-0.5">{divisions.length} {divisions.length !== 1 ? "Divisions" : "Division"}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="divide-y divide-border py-0">
            {isLoading ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Loading divisions...</p>
            ) : divisions.length === 0 ? (
              <EmptyState message="No divisions yet. Add one to get started." />
            ) : (
              divisions.map((division) => (
                <div key={division.id} className="flex items-center justify-between py-3 px-1 -mx-1 rounded-lg hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 shrink-0">
                      <Layers className="h-4 w-4 text-primary" />
                    </div>
                    {editingId === division.id ? (
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-8 w-40 text-sm"
                        maxLength={100}
                        onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
                        autoFocus
                        disabled={renameMutation.isPending}
                      />
                    ) : (
                      <div>
                        <p className="text-sm font-medium text-foreground">{division.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Since {new Date(division.createdAt).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {editingId === division.id ? (
                      <>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={saveEdit} disabled={renameMutation.isPending}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={cancelEdit} disabled={renameMutation.isPending}>
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => startEdit(division)}
                          disabled={isApiLoading || deleteMutation.isPending}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setPendingDelete(division)}
                          disabled={isApiLoading || deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <BottomNav />

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => { if (!open) setPendingDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Division?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium text-foreground">Name:</span> {pendingDelete?.name}</p>
                <p className="pt-1 text-muted-foreground">
                  If this division has linked records, deletion will be blocked — reassign or remove them first.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { deleteMutation.mutate(pendingDelete!.id); setPendingDelete(null); }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DivisionsPage;
