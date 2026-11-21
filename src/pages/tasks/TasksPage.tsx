import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format, addDays, subDays, parseISO, isToday, isBefore, startOfDay } from "date-fns";
import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { taskApi } from "@/api/task";
import type { Task, DailyNote } from "@/types";
import { buildContainers, useMultiContainerDrag } from "./useMultiContainerDrag";
import SortableItem from "./SortableItem";
import DroppableContainer from "./DroppableContainer";
import TaskBoard from "./TaskBoard";
import { TASK_CATEGORIES } from "@/config/taskCategories";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import PageShell from "@/components/PageShell";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import CardLoader from "@/components/CardLoader";
import DatePickerDrawer from "@/components/DatePickerDrawer";
import { useToast } from "@/hooks/use-toast";
import { useApiLoading } from "@/state/apiLoading";
import { useAuth } from "@/context/AuthContext";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Users,
  Circle,
  CheckCircle2,
  Calendar,
  CornerDownRight,
  MessageSquare,
  Pencil,
  Trash2,
  Building2,
  Lock,
  FileText,
  AlertCircle,
  LayoutGrid,
  List as ListIcon,
  GripVertical,
  Bell,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

type MainTab = 'my' | 'team' | 'notes';
type SubTab = 'today' | 'pending' | 'overdue' | 'completed' | 'followups';
type ViewMode = 'list' | 'board';

const PRIORITY_COLORS: Record<string, string> = {
  High:   'text-destructive bg-destructive/10 border-destructive/20',
  Medium: 'text-amber-600 bg-amber-500/10 border-amber-500/20',
  Low:    'text-muted-foreground bg-muted border-border',
};

function formatDateShort(dateStr: string) {
  try {
    return format(parseISO(dateStr), "d MMM");
  } catch {
    return dateStr;
  }
}

function isCarriedForward(task: Task) {
  return task.originalTargetDate.slice(0, 10) !== task.currentTargetDate.slice(0, 10);
}

// ── Task Card ─────────────────────────────────────────────────────────────────
const TaskCard = ({
  task,
  currentUserId,
  onComplete,
  onMoveToTomorrow,
  onDelete,
  showCreator = false,
  dragHandle,
}: {
  task: Task;
  currentUserId: string;
  onComplete: (t: Task) => void;
  onMoveToTomorrow: (t: Task) => void;
  onDelete: (t: Task) => void;
  showCreator?: boolean;
  dragHandle?: React.ReactNode;
}) => {
  const navigate = useNavigate();
  const isCompleted = task.status === 'Completed';
  const carried = isCarriedForward(task);
  const isOverdue =
    !isCompleted &&
    isBefore(startOfDay(parseISO(task.currentTargetDate)), startOfDay(new Date()));
  const isOwner = task.createdByUserId === currentUserId;
  const followUpPending = isCompleted && task.needsFollowUp && !task.followUpResolvedAt;
  const followUpOverdue =
    followUpPending &&
    isBefore(startOfDay(parseISO(task.followUpDate!)), startOfDay(new Date()));
  const followUpResolved = isCompleted && task.needsFollowUp && !!task.followUpResolvedAt;

  return (
    <div
      className={cn(
        "flex items-start gap-1 py-3 px-1 -mx-1 rounded-lg hover:bg-muted/40 transition-colors",
        isCompleted && "opacity-60"
      )}
    >
      {dragHandle}
      {/* Checkbox */}
      <button
        className="mt-0.5 shrink-0 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all"
        style={{ borderColor: isCompleted ? 'var(--color-primary)' : undefined }}
        onClick={() => onComplete(task)}
      >
        {isCompleted ? (
          <CheckCircle2 className="h-4 w-4 text-primary" />
        ) : (
          <Circle className="h-4 w-4 text-muted-foreground/40" />
        )}
      </button>

      {/* Content */}
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => navigate(`/tasks/${task.id}`)}
      >
        <div className="flex items-start gap-2 flex-wrap">
          <p
            className={cn(
              "text-sm font-medium leading-snug break-words",
              isCompleted && "line-through text-muted-foreground"
            )}
          >
            {task.title}
          </p>
          {task.visibility === 'Organisation' && (
            <span className="shrink-0 flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Building2 className="h-2.5 w-2.5" /> Org
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
          <span
            className={cn(
              "text-[10px] font-medium px-1.5 py-0.5 rounded border",
              PRIORITY_COLORS[task.priority]
            )}
          >
            {task.priority}
          </span>
          <span className="text-[10px] text-muted-foreground">{task.category}</span>
          {!isCompleted && (
            <span
              className={cn(
                "text-[10px]",
                isOverdue ? "text-destructive font-semibold" : "text-muted-foreground"
              )}
            >
              {isOverdue
                ? `Overdue · ${formatDateShort(task.currentTargetDate)}`
                : formatDateShort(task.currentTargetDate)}
            </span>
          )}
          {carried && !isCompleted && (
            <span className="text-[10px] text-amber-600 flex items-center gap-0.5">
              <CornerDownRight className="h-2.5 w-2.5" /> from{" "}
              {formatDateShort(task.originalTargetDate)}
            </span>
          )}
          {followUpPending && (
            <span
              className={cn(
                "text-[10px] font-medium px-1.5 py-0.5 rounded border flex items-center gap-0.5",
                followUpOverdue
                  ? "text-destructive bg-destructive/10 border-destructive/20"
                  : "text-violet-600 bg-violet-500/10 border-violet-500/20"
              )}
            >
              <Bell className="h-2.5 w-2.5" />
              Follow-up{followUpOverdue ? " overdue" : ""} · {formatDateShort(task.followUpDate!)}
            </span>
          )}
          {followUpResolved && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Check className="h-2.5 w-2.5" /> Follow-up resolved
            </span>
          )}
        </div>
        {showCreator && (
          <p className="text-[10px] text-muted-foreground mt-0.5">
            By {task.createdByUsername}
            {task.assignedToUsername ? ` → ${task.assignedToUsername}` : ' → Unassigned'}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="shrink-0 flex items-center gap-0.5">
        {!isCompleted && (
          <button
            className="h-9 w-9 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onMoveToTomorrow(task);
            }}
          >
            <CornerDownRight className="h-3.5 w-3.5" />
          </button>
        )}
        {isOwner && (
          <button
            className="h-9 w-9 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const TasksPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const isApiLoading = useApiLoading();
  const { user } = useAuth();
  const currentUserId = user?.id ?? '';

  const [mainTab, setMainTab] = useState<MainTab>('my');
  const [subTab, setSubTab] = useState<SubTab>('pending');
  const [view, setView] = useState<ViewMode>('board');
  const [catFilter, setCatFilter] = useState('');
  const [priFilter, setPriFilter] = useState('');
  const [followUpOnly, setFollowUpOnly] = useState(false);
  const scope: 'my' | 'team' = mainTab === 'team' ? 'team' : 'my';

  // Notes state
  const [noteDate, setNoteDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [personalContent, setPersonalContent] = useState('');
  const [orgContent, setOrgContent] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);

  // Dialogs
  const [pendingComplete, setPendingComplete] = useState<Task | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null);
  const [pendingMove, setPendingMove] = useState<Task | null>(null);
  const [moveDateValue, setMoveDateValue] = useState(
    format(addDays(new Date(), 1), 'yyyy-MM-dd')
  );

  const today = format(new Date(), 'yyyy-MM-dd');
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');

  // ── Queries ─────────────────────────────────────────────────────────────────
  // Board view needs every status at once (Pending/InProgress/Completed columns), not the
  // date/status-filtered subTab view, so it asks the API for "all" instead.
  const effectiveView = view === 'board' ? 'all' : subTab;

  // Infinite, not a plain query: `nextCursor` is only ever non-null for the Completed bucket
  // (the "completed" view, or the Completed column inside the board's "all" view) — every other
  // view's single page already has everything, so `hasNextPage` there is just always false.
  const myQuery = useInfiniteQuery({
    queryKey: ['tasks-my', effectiveView, catFilter, priFilter, followUpOnly],
    queryFn: ({ pageParam }) =>
      taskApi.getMyTasks({
        view: effectiveView,
        category: catFilter || undefined,
        priority: priFilter || undefined,
        before: pageParam ?? undefined,
        needsFollowUp: followUpOnly || undefined,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    placeholderData: keepPreviousData,
    enabled: mainTab === 'my',
  });

  const teamQuery = useInfiniteQuery({
    queryKey: ['tasks-team', effectiveView, catFilter, priFilter, followUpOnly],
    queryFn: ({ pageParam }) =>
      taskApi.getTeamTasks({
        view: effectiveView,
        category: catFilter || undefined,
        priority: priFilter || undefined,
        before: pageParam ?? undefined,
        needsFollowUp: followUpOnly || undefined,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    placeholderData: keepPreviousData,
    enabled: mainTab === 'team',
  });

  const tasksError = mainTab === 'my' ? myQuery.isError : teamQuery.isError;
  const tasksRefetch = mainTab === 'my' ? myQuery.refetch : teamQuery.refetch;
  const hasMoreCompleted = mainTab === 'my' ? myQuery.hasNextPage : teamQuery.hasNextPage;
  const loadingMoreCompleted = mainTab === 'my' ? myQuery.isFetchingNextPage : teamQuery.isFetchingNextPage;
  const loadMoreCompleted = () => (mainTab === 'my' ? myQuery.fetchNextPage() : teamQuery.fetchNextPage());

  const notesQuery = useQuery({
    queryKey: ['task-notes', noteDate],
    queryFn: () => taskApi.getNotesByDate(noteDate, true),
    enabled: mainTab === 'notes',
  });

  const recentQuery = useQuery({
    queryKey: ['task-notes-recent'],
    queryFn: () => taskApi.getRecentNotes(5),
    enabled: mainTab === 'notes',
  });

  // Sync note content from query
  useEffect(() => {
    if (notesQuery.data) {
      setPersonalContent(notesQuery.data.personal?.content ?? '');
      const myOrgNote = notesQuery.data.orgNotes.find(
        (n) => n.createdByUserId === currentUserId
      );
      setOrgContent(myOrgNote?.content ?? '');
    }
  }, [notesQuery.data, currentUserId]);

  // ── Mutations ────────────────────────────────────────────────────────────────
  const invalidateTasks = () => {
    qc.invalidateQueries({ queryKey: ['tasks-my'] });
    qc.invalidateQueries({ queryKey: ['tasks-team'] });
    qc.invalidateQueries({ queryKey: ['task-summary'] });
  };

  const completeMutation = useMutation({
    mutationFn: (t: Task) =>
      taskApi.changeStatus(t.id, t.status === 'Completed' ? 'Pending' : 'Completed'),
    onSuccess: () => {
      invalidateTasks();
      toast({ title: 'Task updated' });
    },
    onError: () =>
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' }),
  });

  const moveMutation = useMutation({
    mutationFn: ({ id, date }: { id: string; date: string }) =>
      taskApi.changeDate(id, date),
    onSuccess: () => {
      invalidateTasks();
      setPendingMove(null);
      toast({ title: 'Date updated' });
    },
    onError: () =>
      toast({ title: 'Error', description: 'Failed to move task', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => taskApi.deleteTask(id),
    onSuccess: () => {
      invalidateTasks();
      setPendingDelete(null);
      toast({ title: 'Task deleted' });
    },
    onError: () =>
      toast({ title: 'Error', description: 'Failed to delete task', variant: 'destructive' }),
  });

  const saveNoteMutation = useMutation({
    mutationFn: ({
      date,
      content,
      visibility,
    }: {
      date: string;
      content: string;
      visibility: string;
    }) => taskApi.upsertNote(date, content, visibility),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['task-notes', noteDate] });
      qc.invalidateQueries({ queryKey: ['task-notes-recent'] });
    },
  });

  const handleSavePersonalNote = () => {
    if (!personalContent.trim()) return;
    setNoteSaving(true);
    saveNoteMutation.mutate(
      { date: noteDate, content: personalContent, visibility: 'Personal' },
      { onSettled: () => setNoteSaving(false) }
    );
  };

  const handleSaveOrgNote = () => {
    if (!orgContent.trim()) return;
    setNoteSaving(true);
    saveNoteMutation.mutate(
      { date: noteDate, content: orgContent, visibility: 'Organisation' },
      { onSettled: () => setNoteSaving(false) }
    );
  };

  const tasks = useMemo(
    () =>
      mainTab === 'my'
        ? (myQuery.data?.pages.flatMap((p) => p.items) ?? [])
        : (teamQuery.data?.pages.flatMap((p) => p.items) ?? []),
    [mainTab, myQuery.data, teamQuery.data]
  );
  const loading = mainTab === 'my' ? myQuery.isLoading : teamQuery.isLoading;

  const overdueCount = (myQuery.data?.pages.flatMap((p) => p.items) ?? []).filter(
    (t) =>
      t.status !== 'Completed' &&
      isBefore(startOfDay(parseISO(t.currentTargetDate)), startOfDay(new Date()))
  ).length;

  // "my" = private order, only this user sees it; "team" = shared order, the whole org sees it.
  const reorderMutation = useMutation({
    mutationFn: (orderedTaskIds: string[]) => taskApi.reorder(scope, orderedTaskIds),
    onSuccess: () => invalidateTasks(),
    onError: () => {
      toast({ title: 'Error', description: 'Failed to save the new order', variant: 'destructive' });
      invalidateTasks();
    },
  });

  // Pending groups by date (so a drop on another date's group reschedules it); every other
  // sub-tab is a single flat, reorderable list.
  const listKeyOf = (t: Task) => (subTab === 'pending' ? t.currentTargetDate.slice(0, 10) : 'flat');
  const listContainerKeys =
    subTab === 'pending'
      ? Array.from(new Set(tasks.map(listKeyOf))).sort((a, b) => a.localeCompare(b))
      : ['flat'];

  const {
    containers: listContainers,
    setContainers: setListContainers,
    activeId: listActiveId,
    sensors: listSensors,
    collisionDetection: listCollisionDetection,
    handleDragStart: listDragStart,
    handleDragOver: listDragOver,
    handleDragEnd: listDragEnd,
    handleDragCancel: listDragCancel,
  } = useMultiContainerDrag(async (containerKey, orderedIds, movedFrom, movedId) => {
    if (movedFrom && subTab === 'pending') {
      // Dropped on a different date group → reschedule first, then persist order within it
      // (sequenced so the order-save's refetch can't land before the date change does).
      await moveMutation.mutateAsync({ id: movedId, date: containerKey }).catch(() => {});
    }
    reorderMutation.mutate(orderedIds);
  });

  useEffect(() => {
    setListContainers(buildContainers(tasks, listContainerKeys, listKeyOf, (t) => t.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, subTab]);

  return (
    <>
    <PageShell title="Tasks & Notes" subtitle="Manage your work">

        {/* Main tab selector */}
        <div className="grid grid-cols-3 rounded-xl border border-border bg-muted/40 p-1 gap-1">
          {(
            [
              ['my', 'My Tasks', ClipboardList],
              ['team', 'Team', Users],
              ['notes', 'Notes', FileText],
            ] as const
          ).map(([tab, label, Icon]) => (
            <button
              key={tab}
              onClick={() => {
                setMainTab(tab);
                setSubTab('pending');
              }}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-lg py-2 px-1 text-xs font-semibold transition-all overflow-hidden",
                mainTab === tab
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>

        {/* ── My Tasks / Team ─────────────────────────────────────────────── */}
        {(mainTab === 'my' || mainTab === 'team') && (
          <>
            {/* List / Board toggle */}
            <div className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-muted/40 p-1 max-w-full sm:max-w-[220px]">
              {(
                [
                  ['board', 'Board', LayoutGrid],
                  ['list', 'List', ListIcon],
                ] as const
              ).map(([v, label, Icon]) => (
                <button
                  key={v}
                  onClick={() => {
                    setView(v);
                    if (v !== 'board') setFollowUpOnly(false);
                  }}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-semibold transition-all",
                    view === v
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {view === 'board' ? (
              <p className="text-[11px] text-muted-foreground">
                Drag a card between columns to change its status. Drag up or down to reorder —{' '}
                {mainTab === 'team' ? 'everyone in the org sees this order.' : 'only you see this order.'}
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Drag <GripVertical className="inline h-3 w-3 -mt-0.5" /> to reorder
                {subTab === 'pending' ? ', or drop a task onto another date to reschedule it' : ''} —{' '}
                {mainTab === 'team' ? 'everyone in the org sees this order.' : 'only you see this order.'}
              </p>
            )}

            {view === 'list' && (
              <>
                {/* Sub-tab */}
                <div className="flex flex-wrap gap-1">
                  {(['today', 'pending', 'overdue', 'completed', 'followups'] as SubTab[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setSubTab(tab)}
                      className={cn(
                        "flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold rounded-lg border transition-all capitalize",
                        subTab === tab
                          ? tab === 'overdue'
                            ? "bg-destructive text-white border-destructive shadow-sm"
                            : "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-background text-muted-foreground border-border hover:border-primary/40"
                      )}
                    >
                      {tab === 'followups' && <Bell className="h-3 w-3" />}
                      {tab === 'today'
                        ? 'Today'
                        : tab === 'pending'
                        ? 'Pending'
                        : tab === 'overdue'
                        ? 'Overdue'
                        : tab === 'followups'
                        ? 'Follow-ups'
                        : 'Completed'}
                      {tab === 'overdue' &&
                        mainTab === 'my' &&
                        overdueCount > 0 &&
                        subTab !== 'overdue' && (
                          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-white/20 text-[9px] font-bold px-1">
                            {overdueCount}
                          </span>
                        )}
                    </button>
                  ))}
                </div>

                {/* Overdue nudge on Today tab */}
                {mainTab === 'my' && subTab === 'today' && overdueCount > 0 && (
                  <button
                    onClick={() => setSubTab('overdue')}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-medium"
                  >
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {overdueCount} task{overdueCount !== 1 ? 's' : ''} carried forward from previous
                    days — tap to review
                  </button>
                )}
              </>
            )}

            {/* Category filter chips */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setCatFilter('')}
                className={cn(
                  "px-3 py-1.5 text-[11px] font-medium rounded-lg border transition-all",
                  catFilter === ''
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background text-muted-foreground border-border"
                )}
              >
                All
              </button>
              {TASK_CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCatFilter((prev) => (prev === c ? '' : c))}
                  className={cn(
                    "px-3 py-1.5 text-[11px] font-medium rounded-lg border transition-all",
                    catFilter === c
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-background text-muted-foreground border-border"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Priority filter */}
            <div className="flex flex-wrap gap-1.5">
              {['', 'High', 'Medium', 'Low'].map((p) => (
                <button
                  key={p || 'all'}
                  onClick={() => setPriFilter((prev) => (prev === p ? '' : p))}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold rounded-lg border transition-all",
                    priFilter === p
                      ? p === 'High'
                        ? "bg-destructive text-white border-destructive shadow-sm"
                        : p === 'Medium'
                        ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                        : p === 'Low'
                        ? "bg-slate-600 text-white border-slate-600 shadow-sm"
                        : "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-background text-muted-foreground border-border"
                  )}
                >
                  {p || 'All Priority'}
                </button>
              ))}
            </div>

            {/* Needs-follow-up filter — only meaningful on the board, where Completed cards with
                an unresolved follow-up are otherwise mixed in with everything else. */}
            {view === 'board' && (
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setFollowUpOnly((prev) => !prev)}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold rounded-lg border transition-all",
                    followUpOnly
                      ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                      : "bg-background text-muted-foreground border-border"
                  )}
                >
                  <Bell className="h-3 w-3" />
                  Needs follow-up
                </button>
              </div>
            )}

            {/* Add button */}
            <Button
              className="w-full h-11 md:h-10 md:max-w-xs"
              onClick={() =>
                navigate(
                  '/tasks/add',
                  subTab === 'today' ? { state: { defaultDate: today } } : undefined
                )
              }
              disabled={isApiLoading}
            >
              <Plus className="mr-2 h-4 w-4" />
              {mainTab === 'team'
                ? 'Add Team Task'
                : subTab === 'today'
                ? 'Add Task for Today'
                : 'Add Task'}
            </Button>

            {tasksError && <ErrorState message="Failed to load tasks" onRetry={tasksRefetch} />}

            {/* Task list / board — a "Load more" fetch keeps the existing list on screen instead
                of blanking it out, so it's excluded from this full-card loading state. */}
            {(loading || (mainTab === 'my' ? myQuery.isFetching : teamQuery.isFetching)) &&
            !loadingMoreCompleted ? (
              <Card>
                <CardContent className="py-0">
                  <CardLoader />
                </CardContent>
              </Card>
            ) : tasks.length === 0 ? (
              <Card>
                <CardContent className="py-0">
                  <EmptyState
                    message={
                      subTab === 'overdue'
                        ? "No overdue tasks — great work!"
                        : subTab === 'completed'
                        ? "No completed tasks yet"
                        : subTab === 'followups'
                        ? "No follow-ups pending"
                        : "No tasks found"
                    }
                  />
                </CardContent>
              </Card>
            ) : view === 'board' ? (
              <TaskBoard
                tasks={tasks}
                scope={scope}
                currentUserId={currentUserId}
                hasMoreCompleted={hasMoreCompleted}
                loadingMoreCompleted={loadingMoreCompleted}
                onLoadMoreCompleted={loadMoreCompleted}
              />
            ) : (
              <Card>
                <CardContent className="divide-y divide-border py-0">
                  <DndContext
                    sensors={listSensors}
                    collisionDetection={listCollisionDetection}
                    onDragStart={listDragStart}
                    onDragOver={listDragOver}
                    onDragEnd={listDragEnd}
                    onDragCancel={listDragCancel}
                  >
                    {listContainerKeys.map((key) => {
                      const ids = listContainers[key] ?? [];
                      // Keep a group mounted (so it stays a valid drop target) while a drag is
                      // in flight, even if dragging its last card out just emptied it.
                      if (ids.length === 0 && !listActiveId) return null;
                      return (
                        <DroppableContainer key={key} id={key} className="py-1">
                          {subTab === 'pending' && (
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pt-3 pb-1">
                              {isToday(parseISO(key)) ? 'Today' : format(parseISO(key), 'd MMM, EEE')}
                              <span className="ml-1 font-normal">({ids.length})</span>
                            </p>
                          )}
                          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                            {ids.map((id) => {
                              const task = tasks.find((t) => t.id === id);
                              if (!task) return null;
                              return (
                                <SortableItem key={id} id={id}>
                                  {(dragHandle) => (
                                    <TaskCard
                                      task={task}
                                      currentUserId={currentUserId}
                                      showCreator={mainTab === 'team'}
                                      dragHandle={dragHandle}
                                      onComplete={(t) => {
                                        if (t.status === 'Completed') {
                                          completeMutation.mutate(t);
                                          return;
                                        }
                                        setPendingComplete(t);
                                      }}
                                      onMoveToTomorrow={(t) => {
                                        setPendingMove(t);
                                        setMoveDateValue(tomorrow);
                                      }}
                                      onDelete={(t) => setPendingDelete(t)}
                                    />
                                  )}
                                </SortableItem>
                              );
                            })}
                          </SortableContext>
                        </DroppableContainer>
                      );
                    })}
                    <DragOverlay>
                      {listActiveId
                        ? (() => {
                            const dragged = tasks.find((t) => t.id === listActiveId);
                            return dragged ? (
                              <div className="rounded-lg border border-primary/40 bg-card shadow-lg px-1">
                                <TaskCard
                                  task={dragged}
                                  currentUserId={currentUserId}
                                  showCreator={mainTab === 'team'}
                                  onComplete={() => {}}
                                  onMoveToTomorrow={() => {}}
                                  onDelete={() => {}}
                                />
                              </div>
                            ) : null;
                          })()
                        : null}
                    </DragOverlay>
                  </DndContext>
                  {hasMoreCompleted && subTab === 'completed' && (
                    <div className="py-3">
                      <Button
                        variant="outline"
                        className="w-full h-9 text-xs"
                        onClick={loadMoreCompleted}
                        disabled={loadingMoreCompleted}
                      >
                        {loadingMoreCompleted ? 'Loading...' : 'Load more'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* ── Notes Tab ───────────────────────────────────────────────────── */}
        {mainTab === 'notes' && (
          <>
            {/* Date navigation */}
            <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card p-2">
              <button
                onClick={() =>
                  setNoteDate(format(subDays(parseISO(noteDate), 1), 'yyyy-MM-dd'))
                }
                className="h-10 w-10 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="text-center">
                <p className="text-sm font-semibold">
                  {isToday(parseISO(noteDate))
                    ? 'Today'
                    : format(parseISO(noteDate), 'd MMM, yyyy')}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {format(parseISO(noteDate), 'EEEE')}
                </p>
              </div>
              <button
                onClick={() => {
                  const next = format(addDays(parseISO(noteDate), 1), 'yyyy-MM-dd');
                  if (next <= today) setNoteDate(next);
                }}
                disabled={noteDate >= today}
                className="h-10 w-10 flex items-center justify-center rounded-lg hover:bg-muted transition-colors disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Personal note */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Lock className="h-3 w-3 text-muted-foreground" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  My Notes
                </p>
              </div>
              <Textarea
                placeholder="Write your personal notes for today..."
                value={personalContent}
                onChange={(e) => setPersonalContent(e.target.value)}
                onBlur={handleSavePersonalNote}
                className="min-h-[120px] resize-none text-sm leading-relaxed"
              />
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-[10px] text-muted-foreground">
                  {noteSaving
                    ? 'Saving...'
                    : notesQuery.data?.personal
                    ? `Saved · ${format(parseISO(notesQuery.data.personal.updatedAt), 'h:mm a')}`
                    : 'Auto-saves on blur'}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs px-3"
                  onClick={handleSavePersonalNote}
                  disabled={!personalContent.trim() || noteSaving}
                >
                  Save
                </Button>
              </div>
            </div>

            {/* Org / Team note */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Building2 className="h-3 w-3 text-blue-500" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Team Log
                </p>
              </div>

              {/* Others' org notes */}
              {(notesQuery.data?.orgNotes ?? [])
                .filter((n) => n.createdByUserId !== currentUserId)
                .map((note) => (
                  <Card
                    key={note.id}
                    className="mb-2 border-blue-500/20 bg-blue-500/5"
                  >
                    <CardContent className="py-2.5 px-3">
                      <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 mb-1">
                        {note.createdByUsername} ·{' '}
                        {format(parseISO(note.updatedAt), 'h:mm a')}
                      </p>
                      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                        {note.content}
                      </p>
                    </CardContent>
                  </Card>
                ))}

              <Textarea
                placeholder="Add to today's team log (visible to all org members)..."
                value={orgContent}
                onChange={(e) => setOrgContent(e.target.value)}
                onBlur={handleSaveOrgNote}
                className="min-h-[100px] resize-none text-sm leading-relaxed border-blue-500/30 focus:border-blue-500"
              />
              <div className="flex justify-end mt-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs px-3 border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/5"
                  onClick={handleSaveOrgNote}
                  disabled={!orgContent.trim() || noteSaving}
                >
                  Post to Team
                </Button>
              </div>
            </div>

            {/* Recent personal notes */}
            {(recentQuery.data ?? []).filter(
              (n) => n.noteDate.slice(0, 10) !== noteDate
            ).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Recent Notes
                </p>
                <div className="space-y-2">
                  {(recentQuery.data ?? [])
                    .filter((n) => n.noteDate.slice(0, 10) !== noteDate)
                    .map((note) => (
                      <button
                        key={note.id}
                        className="w-full text-left"
                        onClick={() => setNoteDate(note.noteDate.slice(0, 10))}
                      >
                        <Card className="hover:border-primary/40 transition-colors">
                          <CardContent className="py-2.5 px-3">
                            <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">
                              {format(parseISO(note.noteDate), 'd MMM, EEE')}
                            </p>
                            <p className="text-xs text-foreground line-clamp-2">
                              {note.content}
                            </p>
                          </CardContent>
                        </Card>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </>
        )}
    </PageShell>

      {/* Complete confirm */}
      <AlertDialog
        open={!!pendingComplete}
        onOpenChange={(o) => {
          if (!o) setPendingComplete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as Completed?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-sm space-y-1">
                <p>
                  <span className="font-medium text-foreground">Task:</span>{' '}
                  {pendingComplete?.title}
                </p>
                <p className="text-muted-foreground pt-1">
                  This will mark the task as done and record the completion time.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                completeMutation.mutate(pendingComplete!);
                setPendingComplete(null);
              }}
            >
              Complete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirm */}
      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(o) => {
          if (!o) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-sm space-y-1">
                <p>
                  <span className="font-medium text-foreground">Task:</span>{' '}
                  {pendingDelete?.title}
                </p>
                <p className="text-destructive pt-1">
                  The task and its full activity history will be permanently deleted.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteMutation.mutate(pendingDelete!.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Move date sheet */}
      <Sheet
        open={!!pendingMove}
        onOpenChange={(o) => {
          if (!o) setPendingMove(null);
        }}
      >
        <SheetContent
          side="bottom"
          className="max-h-[80vh] overflow-y-auto rounded-t-xl"
        >
          <SheetHeader className="pb-3">
            <SheetTitle>Move Task Date</SheetTitle>
          </SheetHeader>
          <div className="space-y-3 pb-4">
            <p className="text-sm text-muted-foreground">{pendingMove?.title}</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  moveMutation.mutate({ id: pendingMove!.id, date: tomorrow })
                }
              >
                Tomorrow
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  moveMutation.mutate({
                    id: pendingMove!.id,
                    date: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
                  })
                }
              >
                In 3 days
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  moveMutation.mutate({
                    id: pendingMove!.id,
                    date: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
                  })
                }
              >
                Next week
              </Button>
            </div>
            <DatePickerDrawer
              value={moveDateValue}
              onChange={setMoveDateValue}
              allowFuture
            />
            <Button
              className="w-full h-11 md:h-10 md:max-w-xs"
              onClick={() =>
                moveMutation.mutate({ id: pendingMove!.id, date: moveDateValue })
              }
              disabled={moveMutation.isPending}
            >
              {moveMutation.isPending
                ? 'Moving...'
                : 'Move to ' + format(parseISO(moveDateValue), 'd MMM')}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default TasksPage;
