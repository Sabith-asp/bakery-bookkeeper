import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { incomeApi } from "@/api/income";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { Plus, TrendingUp, Trash2 } from "lucide-react";
import type { IncomeFormData } from "@/types";

const IncomePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [filterDate, setFilterDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const { data: incomes = [] } = useQuery({
    queryKey: ["income", filterDate],
    queryFn: () => incomeApi.getAll({ startDate: filterDate, endDate: filterDate }),
  });

  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

  const { data: monthlyIncomes = [] } = useQuery({
    queryKey: ["income", "monthly", monthStart, monthEnd],
    queryFn: () => incomeApi.getAll({ startDate: monthStart, endDate: monthEnd }),
  });

  const monthlyTotal = monthlyIncomes.reduce((s, i) => s + i.amount, 0);
  const dailyTotal = incomes.reduce((s, i) => s + i.amount, 0);

  const deleteMutation = useMutation({
    mutationFn: incomeApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["income"] });
      toast({ title: "Deleted", description: "Income entry removed" });
    },
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="Income" subtitle="Track your earnings" />

      <div className="space-y-4 px-4 pt-2">
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-income/20">
            <CardContent className="py-3">
              <p className="text-xs text-muted-foreground">Today</p>
              <p className="text-lg font-bold text-income">₹{dailyTotal.toLocaleString("en-IN")}</p>
            </CardContent>
          </Card>
          <Card className="border-income/20">
            <CardContent className="py-3">
              <p className="text-xs text-muted-foreground">This Month</p>
              <p className="text-lg font-bold text-income">₹{monthlyTotal.toLocaleString("en-IN")}</p>
            </CardContent>
          </Card>
        </div>

        <Button className="w-full" onClick={() => navigate("/income/add")}>
          <Plus className="mr-2 h-4 w-4" /> Add Income
        </Button>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Filter by Date</label>
          <Input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>

        <Card>
          <CardContent className="divide-y divide-border py-0">
            {incomes.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No income entries</p>
            ) : (
              incomes.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-income/10">
                      <TrendingUp className="h-4 w-4 text-income" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.description}</p>
                      <p className="text-xs text-muted-foreground">{item.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-income">
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

export default IncomePage;
