import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { debtApi } from "@/api/debt";
import { useOrgTimezone, formatInTz } from "@/lib/dateUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PageShell from "@/components/PageShell";
import EmptyState from "@/components/EmptyState";
import { Plus, Banknote, ChevronRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Debt } from "@/types";

type Tab = "Payable" | "Receivable";

const DebtPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("Receivable");
  const [showSettled, setShowSettled] = useState(false);

  const orgTimezone = useOrgTimezone();

  const { data: debts = [], isLoading } = useQuery({
    queryKey: ["debts"],
    queryFn: () => debtApi.getAll(),
  });

  const filtered = debts.filter((d) => d.type === tab && (showSettled || !d.isSettled));

  const totalOutstanding = debts
    .filter((d) => d.type === tab && !d.isSettled)
    .reduce((sum, d) => sum + d.outstandingAmount, 0);

  const settledCount = debts.filter((d) => d.type === tab && d.isSettled).length;

  const isOverdue = (debt: Debt) => {
    const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: orgTimezone });
    return !debt.isSettled && debt.dueDate && debt.dueDate < todayStr;
  };

  return (
    <PageShell
      title="Debts"
      subtitle={tab === "Payable" ? "Money you owe" : "Money owed to you"}
    >
        {/* Tab toggle */}
        <div className="grid grid-cols-2 rounded-xl border border-border bg-muted/40 p-1 gap-1">
          {(["Payable", "Receivable"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "rounded-lg py-2 text-xs font-semibold transition-all",
                tab === t
                  ? t === "Payable"
                    ? "bg-expense text-white shadow-sm"
                    : "bg-income text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "Payable" ? "You Owe" : "Owed to You"}
            </button>
          ))}
        </div>

        {/* Summary card */}
        <Card
          className={cn(
            "shadow-sm border",
            tab === "Payable"
              ? "border-expense/30 bg-expense/5"
              : "border-income/30 bg-income/5"
          )}
        >
          <CardContent className="py-3">
            <p className="text-xs font-medium text-muted-foreground">
              Outstanding · {debts.filter((d) => d.type === tab && !d.isSettled).length} active
            </p>
            <p
              className={cn(
                "text-2xl font-bold mt-0.5",
                tab === "Payable" ? "text-expense" : "text-income"
              )}
            >
              ₹{totalOutstanding.toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>

        <Button className="w-full h-11 md:h-10 md:max-w-xs" onClick={() => navigate("/debts/add", { state: { defaultType: tab } })}>
          <Plus className="mr-2 h-4 w-4" /> Add Debt
        </Button>

        {/* Show settled toggle */}
        {settledCount > 0 && (
          <button
            onClick={() => setShowSettled((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            {showSettled ? "Hide" : "Show"} {settledCount} settled
          </button>
        )}

        <Card className="shadow-sm">
          <CardContent className="divide-y divide-border py-0">
            {isLoading ? (
              <>
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-3 px-1">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-3.5 w-28 rounded-md" />
                        <Skeleton className="h-3 w-20 rounded-md" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-16 rounded-md" />
                  </div>
                ))}
              </>
            ) : filtered.length === 0 ? (
              <EmptyState message={showSettled ? "No debts found" : `No active ${tab === "Payable" ? "payable" : "receivable"} debts`} />
            ) : (
              filtered.map((debt) => {
                const overdue = isOverdue(debt);
                return (
                  <button
                    key={debt.id}
                    className="flex w-full items-center justify-between py-3 px-1 -mx-1 rounded-lg hover:bg-muted/40 transition-colors text-left"
                    onClick={() => navigate(`/debts/${debt.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                          debt.isSettled
                            ? "bg-muted"
                            : tab === "Payable"
                            ? "bg-expense/10"
                            : "bg-income/10"
                        )}
                      >
                        {debt.isSettled ? (
                          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Banknote
                            className={cn(
                              "h-4 w-4",
                              tab === "Payable" ? "text-expense" : "text-income"
                            )}
                          />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium text-foreground">{debt.personName}</p>
                          {overdue && (
                            <span className="flex items-center gap-0.5 text-[10px] font-semibold text-destructive bg-destructive/10 rounded px-1 py-0.5">
                              <AlertCircle className="h-2.5 w-2.5" /> Overdue
                            </span>
                          )}
                          {debt.isSettled && (
                            <span className="text-[10px] font-semibold text-muted-foreground bg-muted rounded px-1 py-0.5">
                              Settled
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {debt.dueDate
                            ? `Due ${formatInTz(debt.dueDate, { day: "2-digit", month: "short" }, orgTimezone)}`
                            : formatInTz(debt.date, { day: "2-digit", month: "short", year: "numeric" }, orgTimezone)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="text-right">
                        <p
                          className={cn(
                            "text-sm font-bold",
                            debt.isSettled
                              ? "text-muted-foreground"
                              : tab === "Payable"
                              ? "text-expense"
                              : "text-income"
                          )}
                        >
                          ₹{debt.outstandingAmount.toLocaleString("en-IN")}
                        </p>
                        {debt.paidAmount > 0 && !debt.isSettled && (
                          <p className="text-[10px] text-muted-foreground">
                            of ₹{debt.amount.toLocaleString("en-IN")}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>
    </PageShell>
  );
};

export default DebtPage;
