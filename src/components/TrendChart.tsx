import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { dashboardApi } from "@/api/dashboard";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

// Resolved from CSS vars in index.css
const INCOME_COLOR  = "hsl(158, 64%, 38%)";
const EXPENSE_COLOR = "hsl(0, 72%, 51%)";
const WAGE_COLOR    = "hsl(38, 90%, 48%)";
const GRID_COLOR    = "hsl(220, 13%, 90%)";
const AXIS_COLOR    = "hsl(220, 9%, 46%)";
const CURSOR_COLOR  = "hsl(220, 14%, 95%)";

const RANGES = [
  { label: "3M", value: 3 },
  { label: "6M", value: 6 },
  { label: "1Y", value: 12 },
] as const;

const formatYAxis = (val: number) => {
  if (val >= 100000) return `${(val / 100000).toFixed(1)}L`;
  if (val >= 1000)   return `${(val / 1000).toFixed(0)}K`;
  return String(val);
};

const formatFull = (val: number) => `₹${val.toLocaleString("en-IN")}`;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2.5 shadow-lg min-w-[148px]">
      <p className="text-xs font-semibold text-foreground mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center justify-between gap-3 py-0.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: p.fill }} />
            <span className="text-xs text-muted-foreground">{p.name}</span>
          </div>
          <span className="text-xs font-bold" style={{ color: p.fill }}>
            ₹{Number(p.value).toLocaleString("en-IN")}
          </span>
        </div>
      ))}
    </div>
  );
};

const TrendChart = () => {
  const { hasModule } = useAuth();
  const hasWages = hasModule("Wages");
  const [months, setMonths] = useState<3 | 6 | 12>(6);
  const [view, setView] = useState<"overview" | "breakdown">("overview");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ["dashboard-trend", months],
    queryFn: () => dashboardApi.getTrend(months),
    staleTime: 30 * 60 * 1000,
  });

  const chartData = data.map((d) => ({
    ...d,
    outflow: d.expense + (hasWages ? d.wage : 0),
  }));

  const cur  = chartData[chartData.length - 1];
  const prev = chartData[chartData.length - 2];

  const incomeDelta =
    cur && prev && prev.income > 0
      ? ((cur.income - prev.income) / prev.income) * 100
      : null;

  const active = activeIndex !== null ? chartData[activeIndex] : null;

  const handleChartClick = (state: any) => {
    if (state?.activeTooltipIndex !== undefined) {
      setActiveIndex((prev) =>
        prev === state.activeTooltipIndex ? null : state.activeTooltipIndex
      );
    }
  };

  const cellOpacity = (i: number) =>
    activeIndex === null || activeIndex === i ? 1 : 0.35;

  return (
    <Card className="shadow-sm">
      <CardContent className="pt-4 pb-4">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Trend
          </p>
          <div className="flex items-center gap-0.5 rounded-lg bg-muted p-0.5">
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => { setMonths(r.value); setActiveIndex(null); }}
                className={cn(
                  "px-2.5 py-1 text-xs font-semibold rounded-md transition-all",
                  months === r.value
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── View toggle ── */}
        <div className="flex gap-1.5 mb-3">
          {(["overview", "breakdown"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "px-2.5 py-1 text-[11px] font-medium rounded-md border capitalize transition-all",
                view === v
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {v}
            </button>
          ))}
        </div>

        {/* ── Chart ── */}
        {isLoading ? (
          <div className="h-44 flex items-center justify-center">
            <p className="text-xs text-muted-foreground">Loading…</p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-44 flex items-center justify-center">
            <p className="text-xs text-muted-foreground">No data yet</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={176}>
            <BarChart
              data={chartData}
              margin={{ top: 4, right: 4, left: -18, bottom: 0 }}
              barCategoryGap="28%"
              barGap={2}
              onClick={handleChartClick}
              style={{ cursor: "pointer" }}
            >
              <CartesianGrid
                vertical={false}
                stroke={GRID_COLOR}
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: AXIS_COLOR }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatYAxis}
                tick={{ fontSize: 10, fill: AXIS_COLOR }}
                axisLine={false}
                tickLine={false}
                width={38}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: CURSOR_COLOR, radius: 4 }}
              />

              {view === "overview" ? (
                <>
                  <Bar dataKey="income" name="Income" radius={[4, 4, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={INCOME_COLOR} opacity={cellOpacity(i)} />
                    ))}
                  </Bar>
                  <Bar dataKey="outflow" name="Outflow" radius={[4, 4, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={EXPENSE_COLOR} opacity={cellOpacity(i)} />
                    ))}
                  </Bar>
                </>
              ) : (
                <>
                  <Bar dataKey="income" name="Income" radius={[4, 4, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={INCOME_COLOR} opacity={cellOpacity(i)} />
                    ))}
                  </Bar>
                  <Bar dataKey="expense" name="Expense" radius={[4, 4, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={EXPENSE_COLOR} opacity={cellOpacity(i)} />
                    ))}
                  </Bar>
                  {hasWages && (
                    <Bar dataKey="wage" name="Wages" radius={[4, 4, 0, 0]}>
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={WAGE_COLOR} opacity={cellOpacity(i)} />
                      ))}
                    </Bar>
                  )}
                </>
              )}
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* ── Legend + trend badge ── */}
        <div className="flex items-center gap-3 mt-1 px-0.5 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: INCOME_COLOR }} />
            <span className="text-[11px] text-muted-foreground">Income</span>
          </div>

          {view === "overview" ? (
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: EXPENSE_COLOR }} />
              <span className="text-[11px] text-muted-foreground">Outflow</span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: EXPENSE_COLOR }} />
                <span className="text-[11px] text-muted-foreground">Expense</span>
              </div>
              {hasWages && (
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: WAGE_COLOR }} />
                  <span className="text-[11px] text-muted-foreground">Wages</span>
                </div>
              )}
            </>
          )}

          {incomeDelta !== null && (
            <div
              className={cn(
                "ml-auto flex items-center gap-1 text-[11px] font-semibold",
                incomeDelta > 0
                  ? "text-income"
                  : incomeDelta < 0
                  ? "text-expense"
                  : "text-muted-foreground"
              )}
            >
              {incomeDelta > 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : incomeDelta < 0 ? (
                <TrendingDown className="h-3 w-3" />
              ) : (
                <Minus className="h-3 w-3" />
              )}
              {Math.abs(incomeDelta).toFixed(0)}% income
            </div>
          )}
        </div>

        {/* ── Selected month detail panel ── */}
        {active && (
          <div className="mt-3 rounded-xl bg-muted/50 border border-border px-3 py-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-foreground">{active.label}</p>
              <button
                onClick={() => setActiveIndex(null)}
                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                ✕
              </button>
            </div>
            <div className={`grid gap-x-2 gap-y-1 ${hasWages ? "grid-cols-3" : "grid-cols-2"}`}>
              <div>
                <p className="text-[10px] text-muted-foreground">Income</p>
                <p className="text-xs font-bold" style={{ color: INCOME_COLOR }}>
                  {formatFull(active.income)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Expense</p>
                <p className="text-xs font-bold" style={{ color: EXPENSE_COLOR }}>
                  {formatFull(active.expense)}
                </p>
              </div>
              {hasWages && (
                <div>
                  <p className="text-[10px] text-muted-foreground">Wages</p>
                  <p className="text-xs font-bold" style={{ color: WAGE_COLOR }}>
                    {formatFull(active.wage)}
                  </p>
                </div>
              )}
            </div>
            <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground font-medium">Net balance</span>
              <span
                className={cn(
                  "text-xs font-bold",
                  active.income - active.expense - (hasWages ? active.wage : 0) >= 0
                    ? "text-income"
                    : "text-expense"
                )}
              >
                {active.income - active.expense - (hasWages ? active.wage : 0) >= 0 ? "+" : ""}
                {formatFull(active.income - active.expense - (hasWages ? active.wage : 0))}
              </span>
            </div>
          </div>
        )}

        {!active && !isLoading && chartData.length > 0 && (
          <p className="mt-2 text-center text-[10px] text-muted-foreground/60">
            Tap a bar to see details
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default TrendChart;
