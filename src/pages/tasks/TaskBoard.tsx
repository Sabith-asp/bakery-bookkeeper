import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format, isBefore, parseISO, startOfDay } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Bell, Building2 } from "lucide-react";
import { taskApi } from "@/api/task";
import type { Task, TaskStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useOrgToday } from "@/lib/dateUtils";
import { buildContainers, useMultiContainerDrag } from "./useMultiContainerDrag";
import SortableItem from "./SortableItem";
import DroppableContainer from "./DroppableContainer";

const PRIORITY_COLORS: Record<string, string> = {
  High: "text-destructive bg-destructive/10 border-destructive/20",
  Medium: "text-amber-600 bg-amber-500/10 border-amber-500/20",
  Low: "text-muted-foreground bg-muted border-border",
};

const COLUMNS: { status: TaskStatus; label: string; dot: string }[] = [
  { status: "Pending", label: "Pending", dot: "bg-muted-foreground/50" },
  { status: "InProgress", label: "In Progress", dot: "bg-blue-500" },
  { status: "Completed", label: "Completed", dot: "bg-primary" },
];

function formatDateShort(dateStr: string) {
  try {
    return format(parseISO(dateStr), "d MMM");
  } catch {
    return dateStr;
  }
}

function BoardCard({ task, showCreator }: { task: Task; showCreator: boolean }) {
  const orgToday = startOfDay(parseISO(useOrgToday()));
  const isOverdue =
    task.status !== "Completed" &&
    isBefore(startOfDay(parseISO(task.currentTargetDate)), orgToday);
  const followUpPending = task.status === "Completed" && task.needsFollowUp && !task.followUpResolvedAt;
  const followUpOverdue =
    followUpPending && isBefore(startOfDay(parseISO(task.followUpDate!)), orgToday);
  return (
    <div className="rounded-lg border border-border bg-card p-2.5 shadow-sm">
      <p className="text-xs font-medium leading-snug break-words">{task.title}</p>
      <div className="flex flex-wrap items-center gap-1 mt-1.5">
        <span className={cn("text-[9.5px] font-semibold px-1.5 py-0.5 rounded border", PRIORITY_COLORS[task.priority])}>
          {task.priority}
        </span>
        {task.visibility === "Organisation" && (
          <span className="flex items-center gap-0.5 text-[9.5px] font-semibold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Building2 className="h-2.5 w-2.5" /> Org
          </span>
        )}
        <span className={cn("text-[9.5px]", isOverdue ? "text-destructive font-semibold" : "text-muted-foreground")}>
          {isOverdue ? `Overdue · ${formatDateShort(task.currentTargetDate)}` : formatDateShort(task.currentTargetDate)}
        </span>
      </div>
      {followUpPending && (
        <span
          className={cn(
            "mt-1.5 flex items-center gap-0.5 w-fit text-[9.5px] font-semibold px-1.5 py-0.5 rounded border",
            followUpOverdue
              ? "text-destructive bg-destructive/10 border-destructive/20"
              : "text-violet-600 bg-violet-500/10 border-violet-500/20"
          )}
        >
          <Bell className="h-2.5 w-2.5" />
          Follow-up{followUpOverdue ? " overdue" : ""} · {formatDateShort(task.followUpDate!)}
        </span>
      )}
      {showCreator && (
        <p className="text-[9.5px] text-muted-foreground mt-1">By {task.createdByUsername}</p>
      )}
    </div>
  );
}

export default function TaskBoard({
  tasks,
  scope,
  currentUserId,
  hasMoreCompleted,
  loadingMoreCompleted,
  onLoadMoreCompleted,
}: {
  tasks: Task[];
  scope: "my" | "team";
  currentUserId: string;
  hasMoreCompleted?: boolean;
  loadingMoreCompleted?: boolean;
  onLoadMoreCompleted?: () => void;
}) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();

  // Invalidate both: an org-visible task can show up in both My Tasks and Team, so a status
  // or order change made here must not leave the other tab's cache stale.
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["tasks-my"] });
    qc.invalidateQueries({ queryKey: ["tasks-team"] });
    qc.invalidateQueries({ queryKey: ["task-summary"] });
  };

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => taskApi.changeStatus(id, status),
    onSuccess: () => {
      invalidate();
      toast({ title: "Status updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
      invalidate();
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (orderedTaskIds: string[]) => taskApi.reorder(scope, orderedTaskIds),
    onError: () => {
      toast({ title: "Error", description: "Failed to save the new order", variant: "destructive" });
      invalidate();
    },
  });

  const {
    containers,
    setContainers,
    activeId,
    sensors,
    collisionDetection,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  } =
    useMultiContainerDrag(async (containerKey, orderedIds, movedFrom, movedId) => {
      if (movedFrom) {
        // Persist the status change first so the order-save's refetch doesn't land before it
        // and briefly snap the card back to its old column.
        await statusMutation.mutateAsync({ id: movedId, status: containerKey }).catch(() => {});
      }
      reorderMutation.mutate(orderedIds);
    });

  useEffect(() => {
    setContainers(
      buildContainers(
        tasks,
        COLUMNS.map((c) => c.status),
        (t) => t.status,
        (t) => t.id
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks]);

  const byId = (id: string) => tasks.find((t) => t.id === id);
  const activeTask = activeId ? byId(activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex gap-2.5 overflow-x-auto -mx-4 px-4 pb-1 md:mx-0 md:px-0 md:grid md:grid-cols-3 md:overflow-visible">
        {COLUMNS.map((col) => {
          const ids = containers[col.status] ?? [];
          return (
            <DroppableContainer
              key={col.status}
              id={col.status}
              className="shrink-0 w-[78%] max-w-[260px] md:w-auto md:max-w-none flex flex-col rounded-xl border border-border bg-muted/40 overflow-hidden"
            >
              <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                <span className="flex items-center gap-1.5 text-xs font-bold">
                  <span className={cn("h-2 w-2 rounded-full", col.dot)} />
                  {col.label}
                </span>
                <span className="text-[10px] text-muted-foreground bg-background border border-border px-1.5 py-0.5 rounded-full">
                  {ids.length}
                </span>
              </div>
              <div className="flex flex-col gap-2 p-2 min-h-[160px]">
                <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                  {ids.map((id) => {
                    const task = byId(id);
                    if (!task) return null;
                    return (
                      <SortableItem key={id} id={id} fullCardDrag>
                        {() => (
                          <div className="min-w-0" onClick={() => navigate(`/tasks/${task.id}`)}>
                            <BoardCard
                              task={task}
                              showCreator={scope === "team" && task.createdByUserId !== currentUserId}
                            />
                          </div>
                        )}
                      </SortableItem>
                    );
                  })}
                </SortableContext>
                {ids.length === 0 && (
                  <p className="text-center text-[11px] text-muted-foreground py-4">Drop a task here</p>
                )}
                {col.status === "Completed" && hasMoreCompleted && (
                  <Button
                    variant="outline"
                    className="h-8 text-[11px] w-full"
                    onClick={onLoadMoreCompleted}
                    disabled={loadingMoreCompleted}
                  >
                    {loadingMoreCompleted ? "Loading..." : "Load more"}
                  </Button>
                )}
              </div>
            </DroppableContainer>
          );
        })}
      </div>
      <DragOverlay>
        {activeTask ? (
          <div className="w-[240px] rotate-1 shadow-lg">
            <BoardCard task={activeTask} showCreator={scope === "team" && activeTask.createdByUserId !== currentUserId} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
