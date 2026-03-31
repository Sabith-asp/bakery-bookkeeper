import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import DateRangeFilter from "@/components/DateRangeFilter";
import { dashboardApi } from "@/api/dashboard";
import { incomeApi } from "@/api/income";
import { expenseApi } from "@/api/expense";
import { wageApi } from "@/api/wage";
import TrendChart from "@/components/TrendChart";
import { TrendingUp, TrendingDown, Users, Plus } from "lucide-react";

const DashboardPage = () => {
  const navigate = useNavigate();
  const today = format(new Date(), "yyyy-MM-dd");

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  const handleDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  const { data: summary } = useQuery({
    queryKey: ["dashboard-summary", startDate, endDate],
    queryFn: () => dashboardApi.getSummary({ startDate, endDate }),
  });

  const { data: incomeData } = useQuery({
    queryKey: ["income", startDate, endDate, "activity"],
    queryFn: () => incomeApi.getAll({ startDate, endDate, page: 1, pageSize: 20 }),
  });

  const { data: expenseData } = useQuery({
    queryKey: ["expense", startDate, endDate, "activity"],
    queryFn: () => expenseApi.getAll({ startDate, endDate, page: 1, pageSize: 20 }),
  });

  const { data: wageData } = useQuery({
    queryKey: ["wage", startDate, endDate, "activity"],
    queryFn: () => wageApi.getAll({ startDate, endDate, page: 1, pageSize: 20 }),
  });

  const incomes = incomeData?.items ?? [];
  const expenses = expenseData?.items ?? [];
  const wages = wageData?.items ?? [];

  const isToday = startDate === today && endDate === today;

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="Dashboard" subtitle={format(new Date(), "EEEE, MMM d")} />

      <div className="space-y-4 px-4 pt-2">
        <DateRangeFilter startDate={startDate} endDate={endDate} onDateChange={handleDateChange} />

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-[hsl(258_75%_55%)] text-primary-foreground shadow-lg shadow-primary/20 p-5">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(0_0%_100%/0.12)_0%,_transparent_60%)]" />
          <p className="text-sm font-medium opacity-80">{isToday ? "Today's" : "Filtered"} Balance</p>
          <p className="mt-1 text-4xl font-bold font-display tracking-tight">₹{(summary?.balance ?? 0).toLocaleString("en-IN")}</p>
          <div className="mt-4 flex gap-4 border-t border-white/20 pt-4">
            <div className="flex-1">
              <p className="text-[11px] font-medium opacity-70 uppercase tracking-wide">Income</p>
              <p className="text-base font-bold mt-0.5">₹{(summary?.totalIncome ?? 0).toLocaleString("en-IN")}</p>
            </div>
            <div className="w-px bg-white/20" />
            <div className="flex-1">
              <p className="text-[11px] font-medium opacity-70 uppercase tracking-wide">Outflow</p>
              <p className="text-base font-bold mt-0.5">₹{((summary?.totalExpense ?? 0) + (summary?.totalWage ?? 0)).toLocaleString("en-IN")}</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="mb-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Add</h2>
          <div className="grid grid-cols-3 gap-2.5">
            <button
              className="flex flex-col items-center gap-2 py-4 rounded-xl bg-card border border-income/20 hover:border-income/50 hover:bg-income/5 active:scale-95 transition-all shadow-sm"
              onClick={() => navigate("/income/add")}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-income/10">
                <Plus className="h-5 w-5 text-income" />
              </div>
              <span className="text-xs font-semibold text-income">Income</span>
            </button>
            <button
              className="flex flex-col items-center gap-2 py-4 rounded-xl bg-card border border-expense/20 hover:border-expense/50 hover:bg-expense/5 active:scale-95 transition-all shadow-sm"
              onClick={() => navigate("/expenses/add")}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-expense/10">
                <Plus className="h-5 w-5 text-expense" />
              </div>
              <span className="text-xs font-semibold text-expense">Expense</span>
            </button>
            <button
              className="flex flex-col items-center gap-2 py-4 rounded-xl bg-card border border-wage/20 hover:border-wage/50 hover:bg-wage/5 active:scale-95 transition-all shadow-sm"
              onClick={() => navigate("/wages/add")}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-wage/10">
                <Users className="h-5 w-5 text-wage" />
              </div>
              <span className="text-xs font-semibold text-wage">Wage</span>
            </button>
          </div>
        </div>

        <TrendChart />

        <div>
          <h2 className="mb-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {isToday ? "Today's" : "Filtered"} Activity
          </h2>
          <Card className="shadow-sm">
            <CardContent className="divide-y divide-border py-0">
              {incomes.length === 0 && expenses.length === 0 && wages.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No transactions found</p>
              ) : (
                <>
                  {incomes.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-3 px-1 -mx-1 rounded-lg hover:bg-muted/40 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-income/10">
                          <TrendingUp className="h-4 w-4 text-income" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(item.date).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-income">+₹{item.amount.toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                  {expenses.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-3 px-1 -mx-1 rounded-lg hover:bg-muted/40 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-expense/10">
                          <TrendingDown className="h-4 w-4 text-expense" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(item.date).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-expense">-₹{item.amount.toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                  {wages.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-3 px-1 -mx-1 rounded-lg hover:bg-muted/40 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-wage/10">
                          <Users className="h-4 w-4 text-wage" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.employeeName || "Unknown Employee"}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.description ? `${item.description} · ` : ""}
                            {new Date(item.date).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-wage">-₹{item.amount.toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default DashboardPage;
