import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { expenseApi } from "@/api/expense";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BottomNav from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

const categories = ["Parts", "Tools", "Transport", "Utilities", "Office", "Other"];

const AddExpensePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const mutation = useMutation({
    mutationFn: expenseApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense"] });
      toast({ title: "Success", description: "Expense added successfully" });
      navigate("/expenses");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add expense", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      toast({ title: "Error", description: "Enter a valid amount", variant: "destructive" });
      return;
    }
    if (!description.trim()) {
      toast({ title: "Error", description: "Enter a description", variant: "destructive" });
      return;
    }
    if (!category) {
      toast({ title: "Error", description: "Select a category", variant: "destructive" });
      return;
    }
    mutation.mutate({ amount: parsedAmount, description: description.trim(), category, date });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="flex items-center gap-2 px-4 pt-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold font-display">Add Expense</h1>
      </div>

      <div className="px-4 pt-4">
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Amount (₹)</label>
                <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} min="0" step="0.01" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Description</label>
                <Input placeholder="e.g. Spare parts purchase" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Date</label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : "Save Expense"}
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
