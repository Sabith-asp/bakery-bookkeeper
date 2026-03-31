import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { incomeApi } from "@/api/income";
import type { Income } from "@/types";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import DateRangeFilter from "@/components/DateRangeFilter";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { useApiLoading } from "@/state/apiLoading";
import { Plus, TrendingUp, Trash2, Pencil, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 20;

const IncomePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isApiLoading = useApiLoading();

  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));
  const [pendingDelete, setPendingDelete] = useState<Income | null>(null);
  const [page, setPage] = useState(1);

  const handleDateChange = (s: string, e: string) => {
    setPage(1);
    setStartDate(s);
    setEndDate(e);
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["income", startDate, endDate, page, PAGE_SIZE],
    queryFn: () => incomeApi.getAll({ startDate, endDate, page, pageSize: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });

  const items = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalAmount = data?.totalAmount ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const deleteMutation = useMutation({
    mutationFn: incomeApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["income"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      toast({ title: "Deleted", description: "Income entry removed" });
    },
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="Income" subtitle="Track your earnings" />

      <div className="space-y-4 px-4 pt-2">
        <DateRangeFilter startDate={startDate} endDate={endDate} onDateChange={handleDateChange} />

        <Card className="border-income/30 bg-income/5 shadow-sm">
          <CardContent className="py-3">
            <p className="text-xs font-medium text-muted-foreground">Total · {totalCount} entries</p>
            <p className="text-2xl font-bold text-income mt-0.5">₹{totalAmount.toLocaleString("en-IN")}</p>
          </CardContent>
        </Card>

        <Button className="w-full" onClick={() => navigate("/income/add")} disabled={isApiLoading}>
          <Plus className="mr-2 h-4 w-4" /> {isApiLoading ? "Please wait..." : "Add Income"}
        </Button>

        <Card className={cn("transition-opacity duration-200", isFetching && !isLoading && "opacity-60")}>
          <CardContent className="divide-y divide-border py-0">
            {isLoading ? (
              <>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9 rounded-xl" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-3.5 w-36" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </>
            ) : items.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No income entries found</p>
            ) : (
              <>
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-3 px-1 rounded-lg hover:bg-muted/40 transition-colors -mx-1">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-income/10">
                        <TrendingUp className="h-4 w-4 text-income" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.paymentMethod ? `${item.paymentMethod} · ` : ""}{new Date(item.date).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-semibold text-income mr-1">₹{item.amount.toLocaleString("en-IN")}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => navigate("/income/edit", { state: { item } })} disabled={isApiLoading}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setPendingDelete(item)} disabled={deleteMutation.isPending || isApiLoading}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-3 pb-2">
                    <span className="text-xs text-muted-foreground">Page {page} of {totalPages} · {totalCount} entries</span>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" className="h-7 px-2 text-xs gap-1" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || isFetching}>
                        <ChevronLeft className="h-3 w-3" /> Prev
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 px-2 text-xs gap-1" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || isFetching}>
                        Next <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <BottomNav />

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => { if (!open) setPendingDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Income?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium text-foreground">Description:</span> {pendingDelete?.description}</p>
                <p><span className="font-medium text-foreground">Amount:</span> ₹{pendingDelete?.amount.toLocaleString("en-IN")}</p>
                <p><span className="font-medium text-foreground">Date:</span> {pendingDelete && new Date(pendingDelete.date).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
                <p className="pt-1 text-destructive">This action cannot be undone.</p>
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

export default IncomePage;
