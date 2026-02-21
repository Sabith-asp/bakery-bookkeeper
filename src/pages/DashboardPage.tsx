import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import DateRangeFilter from "@/components/DateRangeFilter";
import { incomeApi } from "@/api/income";
import { expenseApi } from "@/api/expense";
import { wageApi } from "@/api/wage";
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

  const { data: incomes = [] } = useQuery({
    queryKey: ["income", startDate, endDate],
    queryFn: () => incomeApi.getAll({ startDate, endDate }),
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["expense", startDate, endDate],
    queryFn: () => expenseApi.getAll({ startDate, endDate }),
  });

  const { data: wages = [] } = useQuery({
    queryKey: ["wage", startDate, endDate],
    queryFn: () => wageApi.getAll({ startDate, endDate }),
  });

  const summary = useMemo(() => {
    const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
    const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
    const totalWage = wages.reduce((s, w) => s + w.amount, 0);
    return {
      income: totalIncome,
      expense: totalExpense + totalWage,
      balance: totalIncome - totalExpense - totalWage,
    };
  }, [incomes, expenses, wages]);

  const isToday = startDate === today && endDate === today;

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="Dashboard" subtitle={format(new Date(), "EEEE, MMM d")} />

      <div className="space-y-4 px-4 pt-2">
        {/* Date Filter */}
        <DateRangeFilter startDate={startDate} endDate={endDate} onDateChange={handleDateChange} />

        {/* Balance Card */}
        <Card className="bg-primary text-primary-foreground border-0 shadow-lg">
          <CardContent className="py-5">
            <p className="text-sm opacity-80">{isToday ? "Today's" : "Filtered"} Balance</p>
            <p className="text-3xl font-bold font-display">
              ₹{summary.balance.toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>

        {/* Summary Row */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-income/10">
                  <TrendingUp className="h-4 w-4 text-income" />
                </div>
                <span className="text-sm text-muted-foreground">Income</span>
              </div>
              <p className="mt-2 text-xl font-bold text-foreground">
                ₹{summary.income.toLocaleString("en-IN")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-expense/10">
                  <TrendingDown className="h-4 w-4 text-expense" />
                </div>
                <span className="text-sm text-muted-foreground">Expenses</span>
              </div>
              <p className="mt-2 text-xl font-bold text-foreground">
                ₹{summary.expense.toLocaleString("en-IN")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Quick Actions
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <Button
              variant="outline"
              className="flex h-auto flex-col gap-1.5 py-4 border-income/30 hover:bg-income/5"
              onClick={() => navigate("/income/add")}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-income/10">
                <Plus className="h-4 w-4 text-income" />
              </div>
              <span className="text-xs font-medium text-foreground">Income</span>
            </Button>
            <Button
              variant="outline"
              className="flex h-auto flex-col gap-1.5 py-4 border-expense/30 hover:bg-expense/5"
              onClick={() => navigate("/expenses/add")}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-expense/10">
                <Plus className="h-4 w-4 text-expense" />
              </div>
              <span className="text-xs font-medium text-foreground">Expense</span>
            </Button>
            <Button
              variant="outline"
              className="flex h-auto flex-col gap-1.5 py-4 border-wage/30 hover:bg-wage/5"
              onClick={() => navigate("/wages/add")}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-wage/10">
                <Users className="h-4 w-4 text-wage" />
              </div>
              <span className="text-xs font-medium text-foreground">Wage</span>
            </Button>
          </div>
        </div>

        {/* Activity */}
        <div>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {isToday ? "Today's" : "Filtered"} Activity
          </h2>
          <Card>
            <CardContent className="divide-y divide-border py-0">
              {incomes.length === 0 && expenses.length === 0 && wages.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No transactions found
                </p>
              ) : (
                <>
                  {incomes.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-income/10">
                          <TrendingUp className="h-4 w-4 text-income" />
                        </div>
                        <div>
                          <span className="text-sm text-foreground">{item.description}</span>
                          <p className="text-xs text-muted-foreground">
                            {new Date(item.date).toLocaleDateString("en-IN", { 
                              timeZone: "Asia/Kolkata" 
                            })}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-income">
                        +₹{item.amount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                  {expenses.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-expense/10">
                          <TrendingDown className="h-4 w-4 text-expense" />
                        </div>
                        <div>
                          <span className="text-sm text-foreground">{item.description}</span>
                          <p className="text-xs text-muted-foreground">
                            {new Date(item.date).toLocaleDateString("en-IN", { 
                              timeZone: "Asia/Kolkata" 
                            })}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-expense">
                        -₹{item.amount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                  {wages.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-wage/10">
                          <Users className="h-4 w-4 text-wage" />
                        </div>
                        <div>
                          <span className="text-sm text-foreground">{item.employeeName}</span>
                          <p className="text-xs text-muted-foreground">
                            {new Date(item.date).toLocaleDateString("en-IN", { 
                              timeZone: "Asia/Kolkata" 
                            })}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-wage">
                        -₹{item.amount.toLocaleString("en-IN")}
                      </span>
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
