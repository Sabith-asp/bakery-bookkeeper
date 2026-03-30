import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { expenseApi } from "@/api/expense";
import type { Expense } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BottomNav from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { EXPENSE_CATEGORIES } from "@/config/expenseCategories";
import { useApiLoading } from "@/state/apiLoading";
import { ArrowLeft, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_DESC = 200;

const AddExpensePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isApiLoading = useApiLoading();

  const editItem = location.state?.item as Expense | undefined;
  const isEditMode = !!editItem;

  const [amount, setAmount] = useState(editItem ? String(editItem.amount) : "");
  const [description, setDescription] = useState(editItem?.description ?? "");
  const [category, setCategory] = useState(editItem?.category ?? "");
  const [date, setDate] = useState(editItem ? editItem.date.substring(0, 10) : format(new Date(), "yyyy-MM-dd"));

  const mutation = useMutation({
    mutationFn: (data: { amount: number; description: string; category: string; date: string }) =>
      isEditMode ? expenseApi.update(editItem!.id, data) : expenseApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      toast({ title: "Success", description: isEditMode ? "Expense updated" : "Expense saved" });
      navigate("/expenses");
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
    mutation.mutate({ amount: parsedAmount, description: description.trim(), category, date });
  };

  const today = format(new Date(), "yyyy-MM-dd");
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-3 border-b border-border/60 bg-card/60 backdrop-blur-sm sticky top-0 z-40">
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full shrink-0" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display leading-tight">{isEditMode ? "Edit Expense" : "Add Expense"}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{isEditMode ? "Update expense entry" : "Record a new expense"}</p>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {/* Accent card */}
        <div className="flex items-center gap-3 rounded-xl bg-expense/10 border border-expense/20 px-4 py-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-expense/15">
            <TrendingDown className="h-5 w-5 text-expense" />
          </div>
          <div>
            <p className="text-sm font-semibold text-expense">{isEditMode ? "Editing Expense Entry" : "New Expense"}</p>
            <p className="text-xs text-expense/70">Parts, tools, operational costs</p>
          </div>
        </div>

        {/* Form */}
        <Card className="shadow-sm">
          <CardContent className="pt-5 pb-5">
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Amount */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-base select-none">₹</span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="0"
                    step="0.01"
                    className="pl-7 h-12 text-base font-semibold"
                    autoFocus={!isEditMode}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-foreground">Description</label>
                  <span className="text-xs text-muted-foreground">{description.length}/{MAX_DESC}</span>
                </div>
                <Input
                  placeholder="e.g. Spare parts purchase"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={MAX_DESC}
                  className="h-11"
                />
              </div>

              {/* Category chips */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Category</label>
                <div className="flex flex-wrap gap-2">
                  {EXPENSE_CATEGORIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className={cn(
                        "px-3 py-1.5 text-xs rounded-lg border font-medium transition-all",
                        category === c
                          ? "bg-expense text-expense-foreground border-expense shadow-sm"
                          : "bg-background text-muted-foreground border-border hover:border-expense/40 hover:text-foreground"
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">Date</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDate(today)}
                    className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-all ${date === today ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:border-primary/40"}`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setDate(yesterday)}
                    className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-all ${date === yesterday ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:border-primary/40"}`}
                  >
                    Yesterday
                  </button>
                </div>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11" />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold bg-expense hover:bg-expense/90 text-expense-foreground mt-1"
                disabled={mutation.isPending || isApiLoading}
              >
                {mutation.isPending ? "Saving..." : isApiLoading ? "Please wait..." : isEditMode ? "Update Expense" : "Save Expense"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default AddExpensePage;
