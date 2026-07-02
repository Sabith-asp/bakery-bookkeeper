import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { debtApi } from "@/api/debt";
import { useOrgTimezone, shortDate, formatInTz } from "@/lib/dateUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Banknote, Pencil, Trash2, Plus, CheckCircle2, AlertCircle, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DebtDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const orgTimezone = useOrgTimezone();

  const [showAddPayment, setShowAddPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [paymentNotes, setPaymentNotes] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null);

  const { data: debt, isLoading } = useQuery({
    queryKey: ["debt", id],
    queryFn: () => debtApi.getById(id!),
    enabled: !!id,
  });

  const addPaymentMutation = useMutation({
    mutationFn: (payload: { amount: number; date: string; notes?: string }) =>
      debtApi.addPayment(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debt", id] });
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      setShowAddPayment(false);
      setPaymentAmount("");
      setPaymentNotes("");
      setPaymentDate(format(new Date(), "yyyy-MM-dd"));
      toast({ title: "Payment recorded" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.response?.data?.message || "Failed to record payment", variant: "destructive" });
    },
  });

  const deletePaymentMutation = useMutation({
    mutationFn: (paymentId: string) => debtApi.deletePayment(id!, paymentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debt", id] });
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      setDeletePaymentId(null);
      toast({ title: "Payment removed" });
    },
  });

  const settleMutation = useMutation({
    mutationFn: () => debtApi.settle(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debt", id] });
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      toast({ title: "Marked as settled" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => debtApi.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      navigate("/debts");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete debt", variant: "destructive" });
    },
  });

  const handleAddPayment = () => {
    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      toast({ title: "Error", description: "Enter a valid payment amount", variant: "destructive" });
      return;
    }
    addPaymentMutation.mutate({
      amount: amt,
      date: paymentDate,
      notes: paymentNotes.trim() || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <PageHeader title="Debt Details" subtitle="" />
        <div className="space-y-4 px-4 pt-2">
          <Skeleton className="h-9 w-32 rounded-lg" />
          <Skeleton className="h-36 w-full rounded-2xl" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!debt) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Debt not found.</p>
        <Button variant="outline" onClick={() => navigate("/debts")}>Back to Debts</Button>
      </div>
    );
  }

  const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: orgTimezone });
  const isOverdue = !debt.isSettled && debt.dueDate && debt.dueDate < todayStr;
  const isPayable = debt.type === "Payable";
  const progressPct = debt.amount > 0 ? Math.min(100, (debt.paidAmount / debt.amount) * 100) : 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title={debt.personName} subtitle={isPayable ? "You owe" : "Owed to you"} />

      <div className="space-y-4 px-4 pt-2">
        {/* Back */}
        <button
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => navigate("/debts")}
        >
          <ArrowLeft className="h-4 w-4" /> All Debts
        </button>

        {/* Main card */}
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl p-5 shadow-lg",
            debt.isSettled
              ? "bg-muted"
              : isPayable
              ? "bg-gradient-to-br from-expense/80 via-expense to-expense/90 text-white"
              : "bg-gradient-to-br from-income/80 via-income to-income/90 text-white"
          )}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className={cn("text-sm font-medium", debt.isSettled ? "text-muted-foreground" : "opacity-80")}>
                {isPayable ? "You owe" : "Owed to you"} · {debt.personName}
              </p>
              <p className={cn("mt-1 text-4xl font-bold tracking-tight", debt.isSettled && "text-muted-foreground")}>
                ₹{debt.outstandingAmount.toLocaleString("en-IN")}
              </p>
              <p className={cn("text-xs mt-1", debt.isSettled ? "text-muted-foreground" : "opacity-70")}>
                outstanding of ₹{debt.amount.toLocaleString("en-IN")} principal
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {debt.isSettled ? (
                <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground bg-background/60 rounded-full px-2.5 py-1">
                  <CheckCircle2 className="h-3 w-3" /> Settled
                </span>
              ) : isOverdue ? (
                <span className="flex items-center gap-1 text-xs font-semibold text-destructive bg-white/90 rounded-full px-2.5 py-1">
                  <AlertCircle className="h-3 w-3" /> Overdue
                </span>
              ) : null}
            </div>
          </div>

          {/* Progress bar */}
          {debt.paidAmount > 0 && (
            <div className="mt-4">
              <div className={cn("h-1.5 w-full rounded-full", debt.isSettled ? "bg-muted-foreground/20" : "bg-white/20")}>
                <div
                  className={cn("h-1.5 rounded-full transition-all", debt.isSettled ? "bg-muted-foreground/60" : "bg-white")}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className={cn("text-[11px] mt-1", debt.isSettled ? "text-muted-foreground" : "opacity-70")}>
                ₹{debt.paidAmount.toLocaleString("en-IN")} paid ({progressPct.toFixed(0)}%)
              </p>
            </div>
          )}

          {/* Due date */}
          {debt.dueDate && (
            <div className={cn("mt-3 text-xs", debt.isSettled ? "text-muted-foreground" : "opacity-80")}>
              Due {formatInTz(debt.dueDate, { day: "2-digit", month: "short", year: "numeric" }, orgTimezone)}
            </div>
          )}
          {debt.notes && (
            <div className={cn("mt-1 text-xs italic", debt.isSettled ? "text-muted-foreground" : "opacity-70")}>
              "{debt.notes}"
            </div>
          )}
        </div>

        {/* Action buttons */}
        {!debt.isSettled && (
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={() => setShowAddPayment((v) => !v)}
              disabled={addPaymentMutation.isPending}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add Payment
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => settleMutation.mutate()}
              disabled={settleMutation.isPending}
            >
              <CheckCircle2 className="mr-1.5 h-4 w-4" />
              {settleMutation.isPending ? "Settling..." : "Mark Settled"}
            </Button>
          </div>
        )}

        {/* Add payment form */}
        {showAddPayment && (
          <Card className="shadow-sm border-primary/20">
            <CardContent className="pt-4 pb-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Record Payment</p>
                <button onClick={() => setShowAddPayment(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base font-bold text-muted-foreground">₹</span>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="Amount"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="pl-7 h-11 text-lg font-bold"
                  disabled={addPaymentMutation.isPending}
                  autoFocus
                />
              </div>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="h-10"
                disabled={addPaymentMutation.isPending}
              />
              <Input
                placeholder="Notes (optional)"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                maxLength={500}
                disabled={addPaymentMutation.isPending}
              />
              <Button
                className="w-full"
                onClick={handleAddPayment}
                disabled={addPaymentMutation.isPending}
              >
                {addPaymentMutation.isPending ? "Saving..." : "Record Payment"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Payment history */}
        <div>
          <h2 className="mb-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Payment History ({debt.payments?.length ?? 0})
          </h2>
          <Card className="shadow-sm">
            <CardContent className="divide-y divide-border py-0">
              {!debt.payments || debt.payments.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No payments recorded yet</p>
              ) : (
                debt.payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between py-3 px-1 -mx-1">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          ₹{payment.amount.toLocaleString("en-IN")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {payment.notes ? `${payment.notes} · ` : ""}
                          {shortDate(payment.date, orgTimezone)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeletePaymentId(payment.id)}
                      disabled={deletePaymentMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Edit / Delete */}
        <div className="flex gap-2 pb-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate("/debts/edit", { state: { item: debt } })}
          >
            <Pencil className="mr-1.5 h-4 w-4" /> Edit
          </Button>
          <Button
            variant="outline"
            className="flex-1 text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60 hover:bg-destructive/5"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="mr-1.5 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <BottomNav />

      {/* Delete debt confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Debt?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium text-foreground">Person:</span> {debt.personName}</p>
                <p><span className="font-medium text-foreground">Amount:</span> ₹{debt.amount.toLocaleString("en-IN")}</p>
                <p className="pt-1 text-destructive">All payment records will also be deleted. This cannot be undone.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete payment confirmation */}
      <AlertDialog open={!!deletePaymentId} onOpenChange={(open) => { if (!open) setDeletePaymentId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Payment?</AlertDialogTitle>
            <AlertDialogDescription>This payment record will be permanently deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletePaymentMutation.mutate(deletePaymentId!)}
              disabled={deletePaymentMutation.isPending}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DebtDetailPage;
