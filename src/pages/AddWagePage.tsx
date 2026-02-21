import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { wageApi } from "@/api/wage";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BottomNav from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

const AddWagePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [employeeName, setEmployeeName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const mutation = useMutation({
    mutationFn: wageApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wage"] });
      toast({ title: "Success", description: "Wage added successfully" });
      navigate("/wages");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add wage", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      toast({ title: "Error", description: "Enter a valid amount", variant: "destructive" });
      return;
    }
    if (!employeeName.trim()) {
      toast({ title: "Error", description: "Enter employee name", variant: "destructive" });
      return;
    }
    mutation.mutate({ employeeName: employeeName.trim(), amount: parsedAmount, date });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="flex items-center gap-2 px-4 pt-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold font-display">Add Wage</h1>
      </div>

      <div className="px-4 pt-4">
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Employee Name</label>
                <Input placeholder="e.g. Rahul" value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} maxLength={100} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Amount (₹)</label>
                <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} min="0" step="0.01" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Date</label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : "Save Wage"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default AddWagePage;
