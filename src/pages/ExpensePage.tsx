import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { expenseApi } from "@/api/expense";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { Plus, TrendingDown, Trash2 } from "lucide-react";

const ExpensePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [filterDate, setFilterDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const { data: expenses = [] } = useQuery({
    queryKey: ["expense", filterDate],
    queryFn: () => expenseApi.getAll({ startDate: filterDate, endDate: filterDate }),
  });

  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

  const { data: monthlyExpenses = [] } = useQuery({
    queryKey: ["expense", "monthly", monthStart, monthEnd],
    queryFn: () => expenseApi.getAll({ startDate: monthStart, endDate: monthEnd }),
  });

  const monthlyTotal = monthlyExpenses.reduce((s, e) => s + e.amount, 0);
  const dailyTotal = expenses.reduce((s, e) => s + e.amount, 0);

  const deleteMutation = useMutation({
    mutationFn: expenseApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense"] });
      toast({ title: "Deleted", description: "Expense entry removed" });
    },
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="Expenses" subtitle="Track your spending" />

      <div className="space-y-4 px-4 pt-2">
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-expense/20">
            <CardContent className="py-3">
              <p className="text-xs text-muted-foreground">Today</p>
              <p className="text-lg font-bold text-expense">₹{dailyTotal.toLocaleString("en-IN")}</p>
            </CardContent>
          </Card>
          <Card className="border-expense/20">
            <CardContent className="py-3">
              <p className="text-xs text-muted-foreground">This Month</p>
              <p className="text-lg font-bold text-expense">₹{monthlyTotal.toLocaleString("en-IN")}</p>
            </CardContent>
          </Card>
        </div>

        <Button className="w-full" onClick={() => navigate("/expenses/add")}>
          <Plus className="mr-2 h-4 w-4" /> Add Expense
        </Button>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Filter by Date</label>
          <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
        </div>

        <Card>
          <CardContent className="divide-y divide-border py-0">
            {expenses.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No expense entries</p>
            ) : (
              expenses.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-expense/10">
                      <TrendingDown className="h-4 w-4 text-expense" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.description}</p>
                      <p className="text-xs text-muted-foreground">{item.category} · {item.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-expense">
                      ₹{item.amount.toLocaleString("en-IN")}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteMutation.mutate(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default ExpensePage;
