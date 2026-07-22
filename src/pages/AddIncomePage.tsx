import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { incomeApi } from "@/api/income";
import { divisionApi } from "@/api/division";
import type { Income } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BottomNav from "@/components/BottomNav";
import DatePickerDrawer from "@/components/DatePickerDrawer";
import { useToast } from "@/hooks/use-toast";
import { PAYMENT_METHODS } from "@/config/paymentMethods";
import { useApiLoading } from "@/state/apiLoading";
import { ArrowLeft, TrendingUp, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import SaveSuccessOverlay from "@/components/SaveSuccessOverlay";

const MAX_DESC = 200;

const AddIncomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isApiLoading = useApiLoading();
  const { hasModule } = useAuth();

  const editItem = location.state?.item as Income | undefined;
  const isEditMode = !!editItem;

  const [amount, setAmount] = useState(editItem ? String(editItem.amount) : "");
  const [description, setDescription] = useState(editItem?.description ?? "");
  const [paymentMethod, setPaymentMethod] = useState(editItem?.paymentMethod ?? "");
  const [divisionId, setDivisionId] = useState(editItem?.divisionId ?? "");
  const [date, setDate] = useState(editItem ? editItem.date.substring(0, 10) : format(new Date(), "yyyy-MM-dd"));
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: divisions = [] } = useQuery({
    queryKey: ["division"],
    queryFn: divisionApi.getAll,
    enabled: hasModule("Divisions"),
  });

  const mutation = useMutation({
    mutationFn: (data: { amount: number; description: string; date: string; paymentMethod?: string; divisionId?: string }) =>
      isEditMode ? incomeApi.update(editItem!.id, data) : incomeApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["income"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      setShowSuccess(true);
      setTimeout(() => navigate("/income"), 900);
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
    mutation.mutate({ amount: parsedAmount, description: description.trim(), date, paymentMethod: paymentMethod || undefined, divisionId: divisionId || undefined });
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
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-income/15">
            <TrendingUp className="h-3.5 w-3.5 text-income" />
          </div>
          <h1 className="text-lg font-bold leading-tight">{isEditMode ? "Edit Income" : "Add Income"}</h1>
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
              placeholder="e.g. Client service payment"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={MAX_DESC}
              className="h-11"
            />
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
            className="w-full h-12 text-base font-semibold bg-income hover:bg-income/90 text-income-foreground"
            disabled={mutation.isPending || isApiLoading}
            onClick={handleSubmit}
          >
            {mutation.isPending ? "Saving..." : isApiLoading ? "Please wait..." : isEditMode ? "Update Income" : "Save Income"}
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default AddIncomePage;
