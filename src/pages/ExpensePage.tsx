import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { expenseApi } from "@/api/expense";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DateRangeFilter from "@/components/DateRangeFilter";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { useApiLoading } from "@/state/apiLoading";
import { Plus, TrendingDown, Trash2 } from "lucide-react";

const ExpensePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isApiLoading = useApiLoading();

  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["expense", startDate, endDate],
    queryFn: () => expenseApi.getAll({ startDate, endDate }),
  });

  const total = expenses.reduce((s, e) => s + e.amount, 0);

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
        <DateRangeFilter startDate={startDate} endDate={endDate} onDateChange={(s, e) => { setStartDate(s); setEndDate(e); }} />

        <Card className="border-expense/20">
          <CardContent className="py-3">
            <p className="text-xs text-muted-foreground">Total ({expenses.length} entries)</p>
            <p className="text-xl font-bold text-expense">₹{total.toLocaleString("en-IN")}</p>
          </CardContent>
        </Card>

        <Button className="w-full" onClick={() => navigate("/expenses/add")} disabled={isApiLoading}>
          <Plus className="mr-2 h-4 w-4" /> {isApiLoading ? "Please wait..." : "Add Expense"}
        </Button>

        <Card>
          <CardContent className="divide-y divide-border py-0">
            {isLoading ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Loading expenses...</p>
            ) : expenses.length === 0 ? (
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
                      <p className="text-xs text-muted-foreground">
                        {item.category} · {new Date(item.date).toLocaleDateString("en-IN", {
                          timeZone: "Asia/Kolkata",
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-expense">₹{item.amount.toLocaleString("en-IN")}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteMutation.mutate(item.id)}
                      disabled={deleteMutation.isPending || isApiLoading}
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
