import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { incomeApi } from "@/api/income";
import type { Income } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BottomNav from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { useApiLoading } from "@/state/apiLoading";
import { ArrowLeft, TrendingUp } from "lucide-react";

const MAX_DESC = 200;

const AddIncomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isApiLoading = useApiLoading();

  const editItem = location.state?.item as Income | undefined;
  const isEditMode = !!editItem;

  const [amount, setAmount] = useState(editItem ? String(editItem.amount) : "");
  const [description, setDescription] = useState(editItem?.description ?? "");
  const [date, setDate] = useState(editItem ? editItem.date.substring(0, 10) : format(new Date(), "yyyy-MM-dd"));

  const mutation = useMutation({
    mutationFn: (data: { amount: number; description: string; date: string }) =>
      isEditMode ? incomeApi.update(editItem!.id, data) : incomeApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["income"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      toast({ title: "Success", description: isEditMode ? "Income updated" : "Income saved" });
      navigate("/income");
    },
    onError: () => {
      toast({ title: "Error", description: isEditMode ? "Failed to update income" : "Failed to save income", variant: "destructive" });
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
    mutation.mutate({ amount: parsedAmount, description: description.trim(), date });
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
          <h1 className="text-2xl font-bold font-display leading-tight">{isEditMode ? "Edit Income" : "Add Income"}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{isEditMode ? "Update income entry" : "Record a new income"}</p>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {/* Accent card */}
        <div className="flex items-center gap-3 rounded-xl bg-income/10 border border-income/20 px-4 py-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-income/15">
            <TrendingUp className="h-5 w-5 text-income" />
          </div>
          <div>
            <p className="text-sm font-semibold text-income">{isEditMode ? "Editing Income Entry" : "New Income"}</p>
            <p className="text-xs text-income/70">Earnings, service payments, receivables</p>
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
                  placeholder="e.g. Oven repair service payment"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={MAX_DESC}
                  className="h-11"
                />
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
                className="w-full h-12 text-base font-semibold bg-income hover:bg-income/90 text-income-foreground mt-1"
                disabled={mutation.isPending || isApiLoading}
              >
                {mutation.isPending ? "Saving..." : isApiLoading ? "Please wait..." : isEditMode ? "Update Income" : "Save Income"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default AddIncomePage;
