import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { debtApi } from "@/api/debt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BottomNav from "@/components/BottomNav";
import DatePickerDrawer from "@/components/DatePickerDrawer";
import SaveSuccessOverlay from "@/components/SaveSuccessOverlay";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Banknote, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Debt } from "@/types";

const AddDebtPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const editItem = location.state?.item as Debt | undefined;
  const defaultType = (location.state?.defaultType as "Payable" | "Receivable") ?? "Payable";
  const isEditMode = !!editItem;

  const [amount, setAmount] = useState(editItem ? String(editItem.amount) : "");
  const [personName, setPersonName] = useState(editItem?.personName ?? "");
  const [type, setType] = useState<"Payable" | "Receivable">(editItem?.type ?? defaultType);
  const [date, setDate] = useState(
    editItem ? editItem.date.substring(0, 10) : format(new Date(), "yyyy-MM-dd")
  );
  const [dueDate, setDueDate] = useState(editItem?.dueDate?.substring(0, 10) ?? "");
  const [notes, setNotes] = useState(editItem?.notes ?? "");
  const [showSuccess, setShowSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: (payload: {
      personName: string;
      amount: number;
      type: "Payable" | "Receivable";
      date: string;
      dueDate?: string;
      notes?: string;
    }) =>
      isEditMode
        ? debtApi.update(editItem!.id, payload)
        : debtApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      setShowSuccess(true);
      setTimeout(() => navigate("/debts"), 900);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || (isEditMode ? "Failed to update" : "Failed to save");
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    const parsedAmount = parseFloat(amount);
    if (!personName.trim()) {
      toast({ title: "Error", description: "Person name is required", variant: "destructive" });
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({ title: "Error", description: "Enter a valid amount", variant: "destructive" });
      return;
    }
    mutation.mutate({
      personName: personName.trim(),
      amount: parsedAmount,
      type,
      date,
      dueDate: dueDate || undefined,
      notes: notes.trim() || undefined,
    });
  };

  const isPending = mutation.isPending;

  return (
    <div className="min-h-screen bg-background pb-40">
      <SaveSuccessOverlay show={showSuccess} />

      <div className="px-4 pt-safe-top md:px-6 lg:max-w-2xl lg:mx-auto">
        <div className="flex items-center gap-3 pt-4 pb-5">
          <button
            onClick={() => navigate("/debts")}
            className="flex h-11 w-11 md:h-10 md:w-10 items-center justify-center rounded-xl bg-muted/60 hover:bg-muted transition-colors"
            disabled={isPending}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold text-foreground">
              {isEditMode ? "Edit Debt" : "Add Debt"}
            </h1>
          </div>
        </div>

        {/* Type selector */}
        <div className="grid grid-cols-2 rounded-xl border border-border bg-muted/40 p-1 gap-1 mb-5">
          {(["Payable", "Receivable"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              disabled={isPending}
              className={cn(
                "rounded-lg py-2.5 md:py-3 text-xs font-semibold transition-all",
                type === t
                  ? t === "Payable"
                    ? "bg-expense text-white shadow-sm"
                    : "bg-income text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "Payable" ? "You Owe" : "Owed to You"}
            </button>
          ))}
        </div>

        {/* Amount */}
        <div className="mb-5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">
            Amount
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground">₹</span>
            <Input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-14 pl-9 text-2xl font-bold"
              disabled={isPending}
            />
          </div>
        </div>

        {/* Person name */}
        <div className="mb-5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">
            {type === "Payable" ? "Who do you owe?" : "Who owes you?"}
          </label>
          <Input
            placeholder="e.g. Rahul, ABC Suppliers"
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
            maxLength={255}
            disabled={isPending}
          />
        </div>

        <div className="h-px bg-border/60 mb-5" />

        {/* Date */}
        <div className="mb-5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">
            Date
          </label>
          <DatePickerDrawer value={date} onChange={setDate} disabled={isPending} />
        </div>

        {/* Due date */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Due Date <span className="normal-case font-normal">(optional)</span>
            </label>
            {dueDate && (
              <button
                type="button"
                onClick={() => setDueDate("")}
                disabled={isPending}
                className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
          {dueDate ? (
            <DatePickerDrawer
              value={dueDate}
              onChange={setDueDate}
              disabled={isPending}
              allowFuture
            />
          ) : (
            <button
              type="button"
              onClick={() => setDueDate(format(new Date(), "yyyy-MM-dd"))}
              disabled={isPending}
              className="flex w-full items-center gap-2 h-11 px-3 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition-all"
            >
              Set a due date...
            </button>
          )}
        </div>

        {/* Notes */}
        <div className="mb-5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">
            Notes <span className="normal-case font-normal">(optional)</span>
          </label>
          <Input
            placeholder="e.g. borrowed for house rent"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
            disabled={isPending}
          />
        </div>
      </div>

      <div className="fixed bottom-16 left-0 right-0 px-4 pb-2 md:px-6">
        <div className="lg:max-w-2xl lg:mx-auto">
          <Button
            className="w-full h-12 text-base font-semibold"
            onClick={handleSubmit}
            disabled={isPending}
          >
            <Check className="mr-2 h-4 w-4" />
            {isPending ? "Saving..." : isEditMode ? "Update Debt" : "Save Debt"}
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default AddDebtPage;
