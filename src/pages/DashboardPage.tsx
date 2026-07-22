import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import PageShell from "@/components/PageShell";
import DateRangeFilter from "@/components/DateRangeFilter";
import { dashboardApi } from "@/api/dashboard";
import { incomeApi } from "@/api/income";
import { expenseApi } from "@/api/expense";
import { wageApi } from "@/api/wage";
import { divisionApi } from "@/api/division";
import TrendChart from "@/components/TrendChart";
import { TrendingUp, TrendingDown, Users, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { hasModule } = useAuth();
  const today = format(new Date(), "yyyy-MM-dd");

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [divisionId, setDivisionId] = useState("");

  const handleDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleDivisionChange = (id: string) => {
    setDivisionId((prev) => (prev === id ? "" : id));
  };

  const { data: divisions = [] } = useQuery({
    queryKey: ["division"],
    queryFn: divisionApi.getAll,
    enabled: hasModule("Divisions"),
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["dashboard-summary", startDate, endDate, divisionId],
    queryFn: () => dashboardApi.getSummary({ startDate, endDate, divisionId: divisionId || undefined }),
    placeholderData: keepPreviousData,
  });

  const { data: incomeData, isLoading: incomeLoading } = useQuery({
    queryKey: ["income", startDate, endDate, divisionId, "activity"],
    queryFn: () => incomeApi.getAll({ startDate, endDate, page: 1, pageSize: 20, divisionId: divisionId || undefined }),
    placeholderData: keepPreviousData,
  });

  const { data: expenseData, isLoading: expenseLoading } = useQuery({
    queryKey: ["expense", startDate, endDate, divisionId, "activity"],
    queryFn: () => expenseApi.getAll({ startDate, endDate, page: 1, pageSize: 20, divisionId: divisionId || undefined }),
    placeholderData: keepPreviousData,
  });

  const { data: wageData, isLoading: wageLoading } = useQuery({
    queryKey: ["wage", startDate, endDate, divisionId, "activity"],
    queryFn: () => wageApi.getAll({ startDate, endDate, page: 1, pageSize: 20, divisionId: divisionId || undefined }),
    enabled: hasModule("Wages"),
    placeholderData: keepPreviousData,
  });

  const activityLoading = incomeLoading || expenseLoading || (hasModule("Wages") && wageLoading);

  const incomes = incomeData?.items ?? [];
  const expenses = expenseData?.items ?? [];
  const wages = wageData?.items ?? [];

  const isToday = startDate === today && endDate === today;

  return (
    <PageShell title="Dashboard" subtitle={format(new Date(), "EEEE, MMM d")}>
      <DateRangeFilter startDate={startDate} endDate={endDate} onDateChange={handleDateChange} />

        {/* Division filter */}
        {divisions.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => handleDivisionChange("")}
              className={cn(
                "px-3 py-1.5 md:px-3.5 md:py-2 text-[11px] font-medium rounded-lg border transition-all",
                divisionId === ""
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background text-muted-foreground border-border hover:border-primary/40"
              )}
            >
              All
            </button>
            {divisions.map((d) => (
              <button
                key={d.id}
                onClick={() => handleDivisionChange(d.id)}
                className={cn(
                  "px-3 py-1.5 md:px-3.5 md:py-2 text-[11px] font-medium rounded-lg border transition-all",
                  divisionId === d.id
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background text-muted-foreground border-border hover:border-primary/40"
                )}
              >
                {d.name}
              </button>
            ))}
          </div>
        )}

        {summaryLoading ? (
          <div className="rounded-2xl bg-muted/60 p-5 space-y-3">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-10 w-40 rounded-md" />
            <div className="flex gap-4 pt-3 border-t border-border">
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-14 rounded-md" />
                <Skeleton className="h-5 w-20 rounded-md" />
              </div>
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-14 rounded-md" />
                <Skeleton className="h-5 w-20 rounded-md" />
              </div>
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-[hsl(215_90%_48%)] text-primary-foreground shadow-lg shadow-primary/20 p-5">
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
        )}

        <div>
          <h2 className="mb-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Add</h2>
          <div className={`grid gap-2.5 ${hasModule("Wages") ? "grid-cols-3" : "grid-cols-2"}`}>
            <button
              className="flex flex-col items-center gap-2 py-4 rounded-xl bg-card border border-income/20 hover:border-income/50 hover:bg-income/5 active:scale-95 transition-all shadow-sm"
              onClick={() => navigate("/income/add")}
            >
              <div className="flex h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-xl bg-income/10">
                <Plus className="h-5 w-5 text-income" />
              </div>
              <span className="text-xs font-semibold text-income">Income</span>
            </button>
            <button
              className="flex flex-col items-center gap-2 py-4 rounded-xl bg-card border border-expense/20 hover:border-expense/50 hover:bg-expense/5 active:scale-95 transition-all shadow-sm"
              onClick={() => navigate("/expenses/add")}
            >
              <div className="flex h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-xl bg-expense/10">
                <Plus className="h-5 w-5 text-expense" />
              </div>
              <span className="text-xs font-semibold text-expense">Expense</span>
            </button>
            {hasModule("Wages") && (
              <button
                className="flex flex-col items-center gap-2 py-4 rounded-xl bg-card border border-wage/20 hover:border-wage/50 hover:bg-wage/5 active:scale-95 transition-all shadow-sm"
                onClick={() => navigate("/wages/add")}
              >
                <div className="flex h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-xl bg-wage/10">
                  <Users className="h-5 w-5 text-wage" />
                </div>
                <span className="text-xs font-semibold text-wage">Wage</span>
              </button>
            )}
          </div>
        </div>

        <TrendChart />

        <div>
          <h2 className="mb-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {isToday ? "Today's" : "Filtered"} Activity
          </h2>
          <Card className="shadow-sm">
            <CardContent className="divide-y divide-border py-0">
              {activityLoading ? (
                <>
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between py-3 px-1">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-3.5 w-32 rounded-md" />
                          <Skeleton className="h-3 w-20 rounded-md" />
                        </div>
                      </div>
                      <Skeleton className="h-4 w-16 rounded-md" />
                    </div>
                  ))}
                </>
              ) : incomes.length === 0 && expenses.length === 0 && wages.length === 0 ? (
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
                  {hasModule("Wages") && wages.map((item) => (
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
    </PageShell>
  );
};

export default DashboardPage;
