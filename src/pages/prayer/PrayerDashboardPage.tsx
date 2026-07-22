import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { prayerApi } from "@/api/prayer";
import type { PrayerRecord, PrayerStatus } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import PageShell from "@/components/PageShell";
import { useToast } from "@/hooks/use-toast";
import {
  Settings,
  CheckCircle2,
  XCircle,
  Clock,
  HeartHandshake,
  BookOpen,
  Users,
  Home,
  Flame,
  ChevronRight,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Constants ──────────────────────────────────────────────────────────────

const ARABIC: Record<string, string> = {
  Fajr: "فجر", Dhuhr: "ظهر", Asr: "عصر", Maghrib: "مغرب", Isha: "عشاء",
};

const PRAYER_ORDER = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

const STATUS_STYLE: Record<PrayerStatus, { label: string; bg: string; text: string; border: string }> = {
  Upcoming:        { label: "Upcoming",         bg: "bg-muted/50",         text: "text-muted-foreground",  border: "border-border/50" },
  ReminderSent:    { label: "Reminder Sent",    bg: "bg-blue-500/10",      text: "text-blue-600",          border: "border-blue-500/30" },
  Pending:         { label: "Pending",           bg: "bg-amber-500/10",     text: "text-amber-600",         border: "border-amber-500/40" },
  CompletedOnTime: { label: "Completed",         bg: "bg-emerald-500/10",   text: "text-emerald-600",       border: "border-emerald-500/30" },
  CompletedLate:   { label: "Completed Late",   bg: "bg-teal-500/10",      text: "text-teal-600",          border: "border-teal-500/30" },
  Missed:          { label: "Missed",            bg: "bg-destructive/10",   text: "text-destructive",       border: "border-destructive/30" },
  Excused:         { label: "Excused",           bg: "bg-purple-500/10",    text: "text-purple-600",        border: "border-purple-500/30" },
  QadaCompleted:   { label: "Qada Completed",   bg: "bg-indigo-500/10",    text: "text-indigo-600",        border: "border-indigo-500/30" },
  Skipped:         { label: "Skipped",           bg: "bg-muted/50",         text: "text-muted-foreground",  border: "border-border/50" },
};

const COMPLETED_STATUSES: PrayerStatus[] = ["CompletedOnTime", "CompletedLate", "QadaCompleted"];
const ACTIVE_STATUSES: PrayerStatus[]    = ["Upcoming", "ReminderSent", "Pending"];

function formatPrayerTime(ts: string): string {
  const [h, m] = ts.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12  = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function timeSpanToSeconds(ts: string): number {
  const [h, m, s] = ts.split(":").map(Number);
  return h * 3600 + m * 60 + (s || 0);
}

// ── Prayer Card ────────────────────────────────────────────────────────────

interface PrayerCardProps {
  record: PrayerRecord;
  isCurrent: boolean;
  onAction: (record: PrayerRecord) => void;
}

const PrayerCard = ({ record, isCurrent, onAction }: PrayerCardProps) => {
  const style    = STATUS_STYLE[record.status] ?? STATUS_STYLE.Upcoming;
  const isDone   = COMPLETED_STATUSES.includes(record.status);
  const isActive = ACTIVE_STATUSES.includes(record.status);

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border p-3 transition-all",
        style.bg, style.border,
        isCurrent && "ring-2 ring-primary/40"
      )}
    >
      {/* Left: icon + name */}
      <div className="flex flex-col items-center min-w-[52px]">
        <span className="text-xl font-arabic leading-none">{ARABIC[record.prayerName]}</span>
        <span className="text-[10px] font-semibold text-muted-foreground mt-0.5">{record.prayerName}</span>
        <span className="text-[10px] text-muted-foreground">{formatPrayerTime(record.prayerTime)}</span>
      </div>

      {/* Divider */}
      <div className="w-px self-stretch bg-border/50" />

      {/* Middle: status + completion */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={cn("text-[11px] font-semibold", style.text)}>{style.label}</span>
          {isCurrent && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground font-semibold">
              Now
            </span>
          )}
        </div>
        {isDone && record.actualCompletionTime && (
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Completed at {format(parseISO(record.actualCompletionTime), "hh:mm a")}
            {record.congregationType && ` · ${record.congregationType}`}
          </p>
        )}
        {record.status === "Missed" && (
          <p className="text-[10px] text-muted-foreground mt-0.5">Prayer window closed</p>
        )}
        {record.status === "Pending" && (
          <p className="text-[10px] text-amber-600 font-medium mt-0.5 animate-pulse">
            Prayer time active
          </p>
        )}
      </div>

      {/* Right: action */}
      {isActive && (
        <button
          onClick={() => onAction(record)}
          className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[11px] font-semibold hover:bg-primary/20 transition-colors"
        >
          Mark
          <ChevronRight className="h-3 w-3" />
        </button>
      )}
      {record.status === "Missed" && (
        <button
          onClick={() => onAction(record)}
          className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 text-[11px] font-semibold hover:bg-indigo-500/20 transition-colors"
        >
          Qada
          <ChevronRight className="h-3 w-3" />
        </button>
      )}
    </div>
  );
};

// ── Action Sheet ───────────────────────────────────────────────────────────

interface ActionSheetProps {
  record: PrayerRecord | null;
  onClose: () => void;
  onSelect: (status: PrayerStatus, congregationType?: string) => void;
  isPending: boolean;
}

const CONGREGATION_OPTIONS = [
  { value: "Congregation", label: "Congregation", icon: Users },
  { value: "Home",         label: "At Home",      icon: Home },
  { value: "Masjid",       label: "At Masjid",    icon: BookOpen },
];

const ActionSheet = ({ record, onClose, onSelect, isPending }: ActionSheetProps) => {
  const [congType, setCongType] = useState<string | undefined>();
  const isMissed = record?.status === "Missed";

  if (!record) return null;

  return (
    <Sheet open={!!record} onOpenChange={(o) => { if (!o) { onClose(); setCongType(undefined); } }}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <span className="text-2xl font-arabic">{ARABIC[record.prayerName]}</span>
            <span>{record.prayerName} — {formatPrayerTime(record.prayerTime)}</span>
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 pb-6">
          {!isMissed ? (
            <>
              {/* Congregation type */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  How did you pray?
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {CONGREGATION_OPTIONS.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setCongType(prev => prev === value ? undefined : value)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all",
                        congType === value
                          ? "bg-primary/10 border-primary/40 text-primary"
                          : "bg-muted/40 border-border text-muted-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mark completed */}
              <button
                onClick={() => onSelect("CompletedOnTime", congType)}
                disabled={isPending}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 font-semibold hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-semibold">Completed</p>
                  <p className="text-[11px] font-normal opacity-80">Mark as prayed on time</p>
                </div>
              </button>

              <button
                onClick={() => onSelect("CompletedLate", congType)}
                disabled={isPending}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-600 font-semibold hover:bg-teal-500/20 transition-colors disabled:opacity-50"
              >
                <Clock className="h-5 w-5 shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-semibold">Completed Late</p>
                  <p className="text-[11px] font-normal opacity-80">Prayed after the time window</p>
                </div>
              </button>

              <button
                onClick={() => onSelect("Excused")}
                disabled={isPending}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-600 font-semibold hover:bg-purple-500/20 transition-colors disabled:opacity-50"
              >
                <HeartHandshake className="h-5 w-5 shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-semibold">Excused</p>
                  <p className="text-[11px] font-normal opacity-80">Travel, illness, or valid reason</p>
                </div>
              </button>

              <button
                onClick={() => onSelect("Missed")}
                disabled={isPending}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive font-semibold hover:bg-destructive/20 transition-colors disabled:opacity-50"
              >
                <XCircle className="h-5 w-5 shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-semibold">Missed</p>
                  <p className="text-[11px] font-normal opacity-80">I did not pray this one</p>
                </div>
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {record.prayerName} was missed. You can make it up as Qada.
              </p>
              <button
                onClick={() => onSelect("QadaCompleted")}
                disabled={isPending}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 font-semibold hover:bg-indigo-500/20 transition-colors disabled:opacity-50"
              >
                <BookOpen className="h-5 w-5 shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-semibold">Mark Qada Completed</p>
                  <p className="text-[11px] font-normal opacity-80">I made up the missed prayer</p>
                </div>
              </button>
              <button
                onClick={() => onSelect("Excused")}
                disabled={isPending}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-600 font-semibold hover:bg-purple-500/20 transition-colors disabled:opacity-50"
              >
                <HeartHandshake className="h-5 w-5 shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-semibold">Mark Excused</p>
                  <p className="text-[11px] font-normal opacity-80">Valid reason (travel / illness)</p>
                </div>
              </button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

// ── Countdown ──────────────────────────────────────────────────────────────

const Countdown = ({ minutesToNext, nextPrayer, nextPrayerTime }: {
  minutesToNext?: number; nextPrayer?: string; nextPrayerTime?: string;
}) => {
  const [remaining, setRemaining] = useState(minutesToNext ?? 0);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setRemaining(minutesToNext ?? 0);
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => setRemaining(prev => Math.max(0, prev - 1 / 60)), 1000);
    return () => clearInterval(intervalRef.current);
  }, [minutesToNext]);

  if (!nextPrayer) return null;

  const hours   = Math.floor(remaining / 60);
  const minutes = Math.floor(remaining % 60);
  const seconds = Math.floor((remaining * 60) % 60);

  return (
    <div className="rounded-2xl border bg-gradient-to-br from-primary/5 to-primary/10 p-4 text-center">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
        Next Prayer
      </p>
      <div className="flex items-center justify-center gap-2 mb-1">
        <span className="text-xl font-arabic text-primary">{ARABIC[nextPrayer]}</span>
        <span className="text-base font-bold">{nextPrayer}</span>
        {nextPrayerTime && <span className="text-sm text-muted-foreground">at {nextPrayerTime}</span>}
      </div>
      <div className="flex items-center justify-center gap-1 text-2xl font-mono font-bold text-primary">
        <span>{String(hours).padStart(2, "0")}</span>
        <span className="opacity-60 animate-pulse">:</span>
        <span>{String(minutes).padStart(2, "0")}</span>
        <span className="opacity-60 animate-pulse">:</span>
        <span>{String(seconds).padStart(2, "0")}</span>
      </div>
    </div>
  );
};

// ── Main Page ──────────────────────────────────────────────────────────────

const PrayerDashboardPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeRecord, setActiveRecord] = useState<PrayerRecord | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["prayer-dashboard"],
    queryFn: prayerApi.getDashboard,
    refetchInterval: 60_000, // refresh every minute
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status, congregationType }: {
      id: string; status: PrayerStatus; congregationType?: string;
    }) => prayerApi.updateStatus(id, { status, congregationType }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["prayer-dashboard"] });
      setActiveRecord(null);
      toast({ title: "Prayer updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update prayer", variant: "destructive" });
    },
  });

  const prayers = data?.prayers
    ? [...data.prayers].sort((a, b) =>
        PRAYER_ORDER.indexOf(a.prayerName) - PRAYER_ORDER.indexOf(b.prayerName))
    : [];

  const completed = data?.completedCount ?? 0;
  const total     = data?.totalPrayers ?? 5;

  const progressPct = total > 0 ? (completed / total) * 100 : 0;

  return (
    <PageShell title="Prayer Tracker" subtitle={data?.todayDay ?? ""}>
      {/* Settings button */}
      <div className="flex justify-end">
        <Button
          variant="ghost" size="sm"
          onClick={() => navigate("/prayer/settings")}
          className="gap-1.5 text-muted-foreground"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Summary strip */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border bg-emerald-500/10 border-emerald-500/20 p-3 text-center">
              <p className="text-2xl font-bold text-emerald-600">{completed}/{total}</p>
              <p className="text-[10px] text-emerald-600 font-medium">Completed</p>
            </div>
            <div className="rounded-xl border bg-amber-500/10 border-amber-500/20 p-3 text-center">
              <p className="text-2xl font-bold text-amber-600">{data?.pendingCount ?? 0}</p>
              <p className="text-[10px] text-amber-600 font-medium">Pending</p>
            </div>
            <div className="rounded-xl border bg-destructive/10 border-destructive/20 p-3 text-center">
              <p className="text-2xl font-bold text-destructive">{data?.missedCount ?? 0}</p>
              <p className="text-[10px] text-destructive font-medium">Missed</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Today's Progress</span>
              <span className="font-semibold">{data?.completionPercentage ?? 0}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Countdown */}
          <Countdown
            minutesToNext={data?.minutesToNextPrayer ?? undefined}
            nextPrayer={data?.nextPrayer ?? undefined}
            nextPrayerTime={data?.nextPrayerTime ?? undefined}
          />

          {/* Streak */}
          {(data?.streak?.currentStreak ?? 0) > 0 && (
            <div className="flex items-center gap-2 rounded-xl border bg-amber-500/10 border-amber-500/20 px-4 py-2.5">
              <Flame className="h-5 w-5 text-amber-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-amber-600">
                  {data!.streak!.currentStreak}-Day Streak!
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Longest: {data!.streak!.longestStreak} days ·{" "}
                  {data!.streak!.totalPrayersCompleted} total prayers completed
                </p>
              </div>
              {(data?.streak?.currentStreak ?? 0) >= 7 && (
                <Trophy className="h-4 w-4 text-amber-500 shrink-0" />
              )}
            </div>
          )}

          {/* Prayer timeline */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Today's Prayers
            </p>
            <Card className="shadow-sm">
              <CardContent className="p-3 space-y-2">
                {prayers.map(record => (
                  <PrayerCard
                    key={record.id}
                    record={record}
                    isCurrent={data?.currentPrayer === record.prayerName}
                    onAction={setActiveRecord}
                  />
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Admin link */}
          <div className="flex justify-center">
            <button
              onClick={() => navigate("/prayer/history")}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              View Prayer History <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </>
      )}

      {/* Action sheet */}
      <ActionSheet
        record={activeRecord}
        onClose={() => setActiveRecord(null)}
        onSelect={(status, congregationType) => {
          if (!activeRecord) return;
          statusMutation.mutate({ id: activeRecord.id, status, congregationType });
        }}
        isPending={statusMutation.isPending}
      />
    </PageShell>
  );
};

export default PrayerDashboardPage;
