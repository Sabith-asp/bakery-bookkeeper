import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, parseISO } from "date-fns";
import { prayerApi } from "@/api/prayer";
import type { PrayerRecord, PrayerStatus } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const PRAYER_ORDER = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

const ARABIC: Record<string, string> = {
  Fajr: "فجر", Dhuhr: "ظهر", Asr: "عصر", Maghrib: "مغرب", Isha: "عشاء",
};

const COMPLETED: PrayerStatus[] = ["CompletedOnTime", "CompletedLate", "QadaCompleted"];

const STATUS_DOT: Record<PrayerStatus, string> = {
  CompletedOnTime: "bg-emerald-500",
  CompletedLate:   "bg-teal-400",
  QadaCompleted:   "bg-indigo-400",
  Missed:          "bg-destructive",
  Excused:         "bg-purple-400",
  Pending:         "bg-amber-400",
  Upcoming:        "bg-muted-foreground/30",
  ReminderSent:    "bg-blue-400",
  Skipped:         "bg-muted-foreground/20",
};

const STATUS_LABEL: Record<PrayerStatus, string> = {
  CompletedOnTime: "On Time",
  CompletedLate:   "Late",
  QadaCompleted:   "Qada",
  Missed:          "Missed",
  Excused:         "Excused",
  Pending:         "Pending",
  Upcoming:        "Upcoming",
  ReminderSent:    "Reminder Sent",
  Skipped:         "Skipped",
};

function formatTime(ts: string): string {
  const [h, m] = ts.split(":");
  const hour = parseInt(h, 10);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}

// ── Day detail card ─────────────────────────────────────────────────────────

const DayDetail = ({ prayers }: { prayers: PrayerRecord[] }) => {
  const sorted = [...prayers].sort(
    (a, b) => PRAYER_ORDER.indexOf(a.prayerName) - PRAYER_ORDER.indexOf(b.prayerName)
  );

  return (
    <div className="space-y-2">
      {sorted.map(r => {
        const done   = COMPLETED.includes(r.status);
        const missed = r.status === "Missed";
        return (
          <div
            key={r.id}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl border",
              done   && "bg-emerald-500/5 border-emerald-500/20",
              missed && "bg-destructive/5 border-destructive/20",
              !done && !missed && "bg-muted/30 border-border/50"
            )}
          >
            <div className={cn("w-2 h-2 rounded-full shrink-0", STATUS_DOT[r.status])} />
            <div className="flex items-center gap-1.5 min-w-[80px]">
              <span className="text-sm font-arabic">{ARABIC[r.prayerName]}</span>
              <span className="text-xs font-medium">{r.prayerName}</span>
            </div>
            <span className="text-xs text-muted-foreground">{formatTime(r.prayerTime)}</span>
            <div className="flex-1" />
            <span className={cn(
              "text-[11px] font-semibold",
              done   ? "text-emerald-600" : missed ? "text-destructive" : "text-muted-foreground"
            )}>
              {STATUS_LABEL[r.status]}
            </span>
            {r.actualCompletionTime && (
              <span className="text-[10px] text-muted-foreground">
                {format(parseISO(r.actualCompletionTime), "hh:mm a")}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ── Main page ───────────────────────────────────────────────────────────────

const PrayerHistoryPage = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [page, setPage] = useState(0); // 0 = last 30d, 1 = 30-60d, etc.

  const endDate   = format(subDays(new Date(), page * 30), "yyyy-MM-dd");
  const startDate = format(subDays(new Date(), page * 30 + 29), "yyyy-MM-dd");

  const { data, isLoading } = useQuery({
    queryKey: ["prayer-history", startDate, endDate],
    queryFn: () => prayerApi.getHistory({ startDate, endDate }),
  });

  const selectedDay = data?.find(d => d.date === selectedDate) ?? null;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 md:px-6 pt-5 pb-3 border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate("/prayer")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-bold">Prayer History</h1>
      </div>

      <div className="px-4 pt-4 pb-4 space-y-4 md:px-6 lg:max-w-2xl lg:mx-auto">
        {/* Period nav */}
        <div className="flex items-center justify-between rounded-xl border bg-card p-2">
          <button
            onClick={() => { setPage(p => p + 1); setSelectedDate(null); }}
            className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="text-sm font-semibold">
            {format(parseISO(startDate), "d MMM")} – {format(parseISO(endDate), "d MMM yyyy")}
          </p>
          <button
            onClick={() => { setPage(p => Math.max(0, p - 1)); setSelectedDate(null); }}
            disabled={page === 0}
            className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Summary stats */}
        {data && data.length > 0 && (
          <div className="grid grid-cols-3 gap-2 text-center">
            {(() => {
              const total     = data.reduce((s, d) => s + d.totalCount, 0);
              const completed = data.reduce((s, d) => s + d.completedCount, 0);
              const rate      = total > 0 ? Math.round(completed / total * 100) : 0;
              return (
                <>
                  <div className="rounded-xl border bg-emerald-500/10 border-emerald-500/20 py-3">
                    <p className="text-xl font-bold text-emerald-600">{completed}</p>
                    <p className="text-[10px] text-emerald-600">Completed</p>
                  </div>
                  <div className="rounded-xl border bg-muted/50 py-3">
                    <p className="text-xl font-bold">{total}</p>
                    <p className="text-[10px] text-muted-foreground">Total</p>
                  </div>
                  <div className="rounded-xl border bg-primary/10 border-primary/20 py-3">
                    <p className="text-xl font-bold text-primary">{rate}%</p>
                    <p className="text-[10px] text-primary">Rate</p>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* Day list */}
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
          </div>
        ) : data?.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">No records for this period.</p>
        ) : (
          <Card className="shadow-sm">
            <CardContent className="py-0 divide-y divide-border/60">
              {data?.map(day => {
                const isSelected = selectedDate === day.date;
                const rate = Math.round(day.completedCount / day.totalCount * 100);

                return (
                  <div key={day.date}>
                    <button
                      className={cn(
                        "w-full flex items-center gap-3 py-3 px-1 hover:bg-muted/40 transition-colors text-left",
                        isSelected && "bg-primary/5"
                      )}
                      onClick={() => setSelectedDate(isSelected ? null : day.date)}
                    >
                      {/* Date */}
                      <div className="min-w-[56px]">
                        <p className="text-xs font-bold">
                          {format(parseISO(day.date), "d MMM")}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {format(parseISO(day.date), "EEE")}
                        </p>
                      </div>

                      {/* Prayer dots */}
                      <div className="flex gap-1 flex-1">
                        {["Fajr","Dhuhr","Asr","Maghrib","Isha"].map(name => {
                          const r = day.prayers.find(p => p.prayerName === name);
                          return (
                            <div
                              key={name}
                              className={cn(
                                "h-2 w-2 rounded-full",
                                r ? STATUS_DOT[r.status] : "bg-muted-foreground/20"
                              )}
                            />
                          );
                        })}
                      </div>

                      {/* Rate */}
                      <div className="text-right">
                        <p className={cn(
                          "text-sm font-bold",
                          rate === 100 ? "text-emerald-600" : rate >= 60 ? "text-amber-600" : "text-destructive"
                        )}>
                          {day.completedCount}/5
                        </p>
                        <p className="text-[10px] text-muted-foreground">{rate}%</p>
                      </div>

                      <ChevronRight className={cn(
                        "h-3.5 w-3.5 text-muted-foreground transition-transform",
                        isSelected && "rotate-90"
                      )} />
                    </button>

                    {/* Expanded detail */}
                    {isSelected && selectedDay && (
                      <div className="px-1 pb-3">
                        <DayDetail prayers={selectedDay.prayers} />
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PrayerHistoryPage;
