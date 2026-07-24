import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { expenseApi } from "@/api/expense";
import { divisionApi } from "@/api/division";
import type { Expense, ExpenseTemplate } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BottomNav from "@/components/BottomNav";
import DatePickerDrawer from "@/components/DatePickerDrawer";
import { useToast } from "@/hooks/use-toast";
import { COMMON_EXPENSE_CATEGORIES, EXPENSE_CATEGORIES } from "@/config/expenseCategories";
import { PAYMENT_METHODS } from "@/config/paymentMethods";
import { useApiLoading } from "@/state/apiLoading";
import { ArrowLeft, TrendingDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import SaveSuccessOverlay from "@/components/SaveSuccessOverlay";

const MAX_DESC = 200;

const AddExpensePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isApiLoading = useApiLoading();
  const { hasModule } = useAuth();

  const editItem = location.state?.item as Expense | undefined;
  const template = location.state?.template as ExpenseTemplate | undefined;
  const isEditMode = !!editItem;

  const [amount, setAmount] = useState(
    editItem ? String(editItem.amount) : template?.amount ? String(template.amount) : ""
  );
  const [description, setDescription] = useState(editItem?.description ?? template?.description ?? "");
  const [category, setCategory] = useState(editItem?.category ?? template?.category ?? "");
  const [showAllCategories, setShowAllCategories] = useState(
    !!(editItem?.category ?? template?.category) &&
    !COMMON_EXPENSE_CATEGORIES.includes((editItem?.category ?? template?.category ?? "") as any)
  );
  const [paymentMethod, setPaymentMethod] = useState(editItem?.paymentMethod ?? template?.paymentMethod ?? "");
  const [divisionId, setDivisionId] = useState(editItem?.divisionId ?? "");
  const [date, setDate] = useState(editItem ? editItem.date.substring(0, 10) : format(new Date(), "yyyy-MM-dd"));
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: divisions = [] } = useQuery({
    queryKey: ["division"],
    queryFn: divisionApi.getAll,
    enabled: hasModule("Divisions"),
  });

  const mutation = useMutation({
    mutationFn: (data: { amount: number; description: string; category: string; date: string; paymentMethod?: string; divisionId?: string }) =>
      isEditMode ? expenseApi.update(editItem!.id, data) : expenseApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      setShowSuccess(true);
      setTimeout(() => navigate("/expenses"), 900);
    },
    onError: () => {
      toast({ title: "Error", description: isEditMode ? "Failed to update expense" : "Failed to save expense", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      toast({ title: "Invalid amount", description: "Enter an amount greater than 0", variant: "destructive" });
      return;
    }
    if (!description.trim()) {
      toast({ title: "Description required", description: "Enter a description", variant: "destructive" });
      return;
    }
    if (!category) {
      toast({ title: "Category required", description: "Select a category", variant: "destructive" });
      return;
    }
    mutation.mutate({ amount: parsedAmount, description: description.trim(), category, date, paymentMethod: paymentMethod || undefined, divisionId: divisionId || undefined });
  };

  return (
    <div className="min-h-screen bg-background pb-40">
      <SaveSuccessOverlay show={showSuccess} />
      {/* Header */}
      <div className="flex items-center gap-3 px-4 md:px-6 lg:px-8 pt-5 pb-3 border-b border-border/60 bg-card/60 backdrop-blur-sm sticky top-0 z-40">
        <Button variant="ghost" size="icon" className="h-11 w-11 md:h-10 md:w-10 rounded-full shrink-0" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-expense/15">
            <TrendingDown className="h-3.5 w-3.5 text-expense" />
          </div>
          <h1 className="text-lg font-bold leading-tight">{isEditMode ? "Edit Expense" : "Add Expense"}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="px-4 pt-5 space-y-6 md:px-6 lg:max-w-2xl lg:mx-auto">

          {/* Amount */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-lg select-none">₹</span>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8 h-14 text-2xl font-bold tracking-tight"
                autoFocus={!isEditMode}
              />
            </div>
          </div>

          <div className="h-px bg-border/60" />

          {/* Description */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground">Description</label>
              <span className="text-xs text-muted-foreground">{description.length}/{MAX_DESC}</span>
            </div>
            <Input
              placeholder="e.g. Office supplies purchase"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={MAX_DESC}
              className="h-11"
            />
          </div>

          <div className="h-px bg-border/60" />

          {/* Category */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Category</label>
            <div className="flex flex-wrap gap-2">
              {(showAllCategories ? EXPENSE_CATEGORIES : COMMON_EXPENSE_CATEGORIES).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={cn(
                    "flex items-center gap-1 px-3 py-2 text-xs rounded-lg border font-medium transition-all md:px-3.5 md:py-2.5",
                    category === c
                      ? "bg-expense text-expense-foreground border-expense shadow-sm"
                      : "bg-background text-muted-foreground border-border hover:border-expense/40 hover:text-foreground"
                  )}
                >
                  {category === c && <Check className="h-3 w-3 shrink-0" />}
                  {c}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowAllCategories((v) => !v)}
                className="px-3 py-2 text-xs rounded-lg border font-medium transition-all border-dashed border-muted-foreground/40 text-muted-foreground hover:text-foreground hover:border-muted-foreground md:px-3.5 md:py-2.5"
              >
                {showAllCategories ? "Show less" : `+${EXPENSE_CATEGORIES.length - COMMON_EXPENSE_CATEGORIES.length} more`}
              </button>
            </div>
          </div>

          <div className="h-px bg-border/60" />

          {/* Date */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Date</label>
            <DatePickerDrawer value={date} onChange={setDate} />
          </div>

          <div className="h-px bg-border/60" />

          {/* Payment Method */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">
              Payment Method <span className="font-normal text-muted-foreground text-xs">(optional)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod((p) => (p === m ? "" : m))}
                  className={cn(
                    "flex items-center gap-1 px-3 py-2 text-xs rounded-lg border font-medium transition-all md:px-3.5 md:py-2.5",
                    paymentMethod === m
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {paymentMethod === m && <Check className="h-3 w-3 shrink-0" />}
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Division */}
          {divisions.length > 0 && (
            <>
              <div className="h-px bg-border/60" />
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">
                  Division <span className="font-normal text-muted-foreground text-xs">(optional)</span>
                </label>
                <Select value={divisionId || "none"} onValueChange={(v) => setDivisionId(v === "none" ? "" : v)}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="No division" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {divisions.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

        </div>
      </form>

      {/* Sticky submit */}
      <div className="fixed bottom-16 left-0 right-0 px-4 md:px-6 pb-3 pt-2 bg-background/95 backdrop-blur-sm border-t border-border/60 z-30">
        <div className="lg:max-w-2xl lg:mx-auto">
          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold bg-expense hover:bg-expense/90 text-expense-foreground"
            disabled={mutation.isPending || isApiLoading}
            onClick={handleSubmit}
          >
            {mutation.isPending ? "Saving..." : isApiLoading ? "Please wait..." : isEditMode ? "Update Expense" : "Save Expense"}
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default AddExpensePage;
