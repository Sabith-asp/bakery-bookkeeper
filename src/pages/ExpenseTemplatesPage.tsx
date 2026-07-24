import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageShell from "@/components/PageShell";
import EmptyState from "@/components/EmptyState";
import { useToast } from "@/hooks/use-toast";
import { COMMON_EXPENSE_CATEGORIES, EXPENSE_CATEGORIES } from "@/config/expenseCategories";
import { PAYMENT_METHODS } from "@/config/paymentMethods";
import { getTemplates, saveTemplate, deleteTemplate } from "@/lib/expenseTemplates";
import type { ExpenseTemplate } from "@/types";
import { Trash2, Check, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

const ExpenseTemplatesPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [templates, setTemplates] = useState<ExpenseTemplate[]>(getTemplates);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [showAllCategories, setShowAllCategories] = useState(false);

  const refresh = () => setTemplates(getTemplates());

  const handleSave = () => {
    if (!name.trim()) {
      toast({ title: "Name required", description: "Give the template a name", variant: "destructive" });
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
    const parsedAmount = amount ? parseFloat(amount) : undefined;
    if (amount && (!parsedAmount || parsedAmount <= 0)) {
      toast({ title: "Invalid amount", description: "Enter a valid amount or leave blank", variant: "destructive" });
      return;
    }
    saveTemplate({ name: name.trim(), description: description.trim(), category, amount: parsedAmount, paymentMethod: paymentMethod || undefined });
    setName(""); setDescription(""); setCategory(""); setAmount(""); setPaymentMethod("");
    setShowAllCategories(false);
    refresh();
    toast({ title: "Template saved" });
  };

  const handleDelete = (id: string) => {
    deleteTemplate(id);
    refresh();
    toast({ title: "Template deleted" });
  };

  return (
    <PageShell title="Expense Templates" subtitle="Quick-fill your common expenses" onBack={() => navigate(-1)}>

      {/* Create form */}
      <Card className="shadow-sm">
        <CardContent className="pt-4 pb-5 space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">New Template</p>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Template Name</label>
            <Input placeholder="e.g. Scooter Petrol" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} className="h-11" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Description</label>
            <Input placeholder="e.g. Scooter Petrol" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} className="h-11" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Category</label>
            <div className="flex flex-wrap gap-2">
              {(showAllCategories ? EXPENSE_CATEGORIES : COMMON_EXPENSE_CATEGORIES).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={cn(
                    "flex items-center gap-1 px-3 py-2 text-xs rounded-lg border font-medium transition-all",
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
                className="px-3 py-2 text-xs rounded-lg border font-medium border-dashed border-muted-foreground/40 text-muted-foreground hover:text-foreground transition-all"
              >
                {showAllCategories ? "Show less" : `+${EXPENSE_CATEGORIES.length - COMMON_EXPENSE_CATEGORIES.length} more`}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">
              Amount <span className="font-normal text-muted-foreground text-xs">(optional)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold select-none">₹</span>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="Leave blank to enter each time"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7 h-11"
              />
            </div>
          </div>

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
                    "flex items-center gap-1 px-3 py-2 text-xs rounded-lg border font-medium transition-all",
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

          <Button className="w-full h-11" onClick={handleSave}>Save Template</Button>
        </CardContent>
      </Card>

      {/* Saved templates */}
      {templates.length === 0 ? (
        <EmptyState message="No templates yet. Create one above." />
      ) : (
        <Card className="shadow-sm">
          <CardContent className="divide-y divide-border py-0">
            {templates.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-3 px-1 -mx-1">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-expense/10">
                    <Layers className="h-4 w-4 text-expense" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{t.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.category}{t.amount ? ` · ₹${t.amount.toLocaleString("en-IN")}` : ""}{t.paymentMethod ? ` · ${t.paymentMethod}` : ""}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(t.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
};

export default ExpenseTemplatesPage;
