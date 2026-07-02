import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format, parseISO, formatDistanceToNow, addDays } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { taskApi } from "@/api/task";
import type { Task, TaskActivity } from "@/types";
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
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import DatePickerDrawer from "@/components/DatePickerDrawer";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Calendar,
  MessageSquare,
  CheckCircle2,
  RefreshCw,
  CornerDownRight,
  Plus,
  Eye,
  Building2,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PRIORITY_COLORS: Record<string, string> = {
  High:   'text-destructive bg-destructive/10 border-destructive/20',
  Medium: 'text-amber-600 bg-amber-500/10 border-amber-500/20',
  Low:    'text-muted-foreground bg-muted border-border',
};

const STATUS_CONFIG = [
  { value: 'Pending',    label: 'Pending',     color: 'bg-muted text-muted-foreground border-border' },
  { value: 'InProgress', label: 'In Progress', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  { value: 'Completed',  label: 'Completed',   color: 'bg-primary/10 text-primary border-primary/20' },
];

const ACTIVITY_CONFIG: Record<
  string,
  { icon: React.ReactNode; color: string; label: (a: TaskActivity) => string }
> = {
  Created:           { icon: <Plus className="h-3 w-3" />,            color: 'bg-muted text-muted-foreground',        label: () => 'Task created' },
  Updated:           { icon: <Pencil className="h-3 w-3" />,          color: 'bg-muted text-muted-foreground',        label: () => 'Task updated' },
  StatusChanged:     { icon: <RefreshCw className="h-3 w-3" />,       color: 'bg-blue-500/10 text-blue-600',          label: (a) => `Status: ${a.oldValue} → ${a.newValue}` },
  Completed:         { icon: <CheckCircle2 className="h-3 w-3" />,    color: 'bg-primary/10 text-primary',            label: () => 'Task completed' },
  DateMoved:         { icon: <Calendar className="h-3 w-3" />,        color: 'bg-amber-500/10 text-amber-600',        label: (a) => `Date moved: ${a.oldValue} → ${a.newValue}` },
  CarryForward:      { icon: <CornerDownRight className="h-3 w-3" />, color: 'bg-orange-500/10 text-orange-600',      label: (a) => `Carried forward from ${a.oldValue}` },
  CommentAdded:      { icon: <MessageSquare className="h-3 w-3" />,   color: 'bg-purple-500/10 text-purple-600',      label: () => 'Comment added' },
  VisibilityChanged: { icon: <Eye className="h-3 w-3" />,             color: 'bg-muted text-muted-foreground',        label: (a) => `Visibility: ${a.oldValue} → ${a.newValue}` },
};

const TaskDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { user } = useAuth();
  const currentUserId = user?.id ?? '';

  const [showCommentSheet, setShowCommentSheet] = useState(false);
  const [showDateSheet, setShowDateSheet] = useState(false);
  const [showVisSheet, setShowVisSheet] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [comment, setComment] = useState('');
  const [newDate, setNewDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', id],
    queryFn: () => taskApi.getById(id!),
    enabled: !!id,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['task', id] });
    qc.invalidateQueries({ queryKey: ['tasks-my'] });
    qc.invalidateQueries({ queryKey: ['tasks-team'] });
    qc.invalidateQueries({ queryKey: ['task-summary'] });
  };

  const statusMutation = useMutation({
    mutationFn: (status: string) => taskApi.changeStatus(id!, status),
    onSuccess: () => { invalidate(); toast({ title: 'Status updated' }); },
    onError: () =>
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' }),
  });

  const dateMutation = useMutation({
    mutationFn: (date: string) => taskApi.changeDate(id!, date),
    onSuccess: () => { invalidate(); setShowDateSheet(false); toast({ title: 'Date moved' }); },
    onError: () =>
      toast({ title: 'Error', description: 'Failed to move date', variant: 'destructive' }),
  });

  const commentMutation = useMutation({
    mutationFn: (text: string) => taskApi.addComment(id!, text),
    onSuccess: () => {
      invalidate();
      setComment('');
      setShowCommentSheet(false);
      toast({ title: 'Comment added' });
    },
    onError: () =>
      toast({ title: 'Error', description: 'Failed to add comment', variant: 'destructive' }),
  });

  const visMutation = useMutation({
    mutationFn: (visibility: string) => taskApi.changeVisibility(id!, visibility),
    onSuccess: () => { invalidate(); setShowVisSheet(false); toast({ title: 'Visibility updated' }); },
    onError: () =>
      toast({ title: 'Error', description: 'Failed to update visibility', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => taskApi.deleteTask(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks-my'] });
      qc.invalidateQueries({ queryKey: ['tasks-team'] });
      navigate('/tasks');
    },
    onError: () =>
      toast({ title: 'Error', description: 'Failed to delete task', variant: 'destructive' }),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <PageHeader title="Task" subtitle="" />
        <div className="px-4 pt-2 space-y-4">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Task not found.</p>
        <Button variant="outline" onClick={() => navigate('/tasks')}>
          Back to Tasks
        </Button>
      </div>
    );
  }

  const isOwner = task.createdByUserId === currentUserId;
  const isOrgTask = task.visibility === 'Organisation';
  const isCarried =
    task.originalTargetDate.slice(0, 10) !== task.currentTargetDate.slice(0, 10);

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title={task.title} subtitle={task.category} />

      <div className="px-4 pt-2 space-y-4">
        {/* Back */}
        <button
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => navigate('/tasks')}
        >
          <ArrowLeft className="h-4 w-4" /> All Tasks
        </button>

        {/* Header card */}
        <Card className="shadow-sm">
          <CardContent className="pt-4 pb-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                <span
                  className={cn(
                    "text-[11px] font-semibold px-2 py-1 rounded-lg border",
                    PRIORITY_COLORS[task.priority]
                  )}
                >
                  {task.priority}
                </span>
                <span className="text-[11px] font-semibold px-2 py-1 rounded-lg border border-border bg-muted text-muted-foreground">
                  {task.category}
                </span>
                {isOrgTask ? (
                  <span className="flex items-center gap-0.5 text-[11px] font-semibold px-2 py-1 rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-600">
                    <Building2 className="h-3 w-3" /> Org
                  </span>
                ) : (
                  <span className="flex items-center gap-0.5 text-[11px] font-semibold px-2 py-1 rounded-lg border border-border bg-muted text-muted-foreground">
                    <Lock className="h-3 w-3" /> Personal
                  </span>
                )}
              </div>
              {isOwner && (
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => navigate('/tasks/edit', { state: { item: task } })}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>

            <h2 className="text-lg font-bold leading-snug">{task.title}</h2>

            {task.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {task.description}
              </p>
            )}

            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>Target: {format(parseISO(task.currentTargetDate), 'd MMM yyyy')}</p>
              {isCarried && (
                <p className="text-amber-600 flex items-center gap-1">
                  <CornerDownRight className="h-3 w-3" />
                  Originally: {format(parseISO(task.originalTargetDate), 'd MMM yyyy')}
                </p>
              )}
              <p>
                Created: {format(parseISO(task.createdAt), 'd MMM yyyy')} by{' '}
                {task.createdByUsername}
              </p>
              {task.assignedToUsername && (
                <p>Assigned to: {task.assignedToUsername}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status selector */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Status
          </p>
          <div className="grid grid-cols-3 gap-2">
            {STATUS_CONFIG.map((s) => (
              <button
                key={s.value}
                onClick={() => statusMutation.mutate(s.value)}
                disabled={statusMutation.isPending}
                className={cn(
                  "py-2.5 text-xs font-semibold rounded-lg border transition-all",
                  task.status === s.value
                    ? s.color + ' shadow-sm'
                    : 'bg-background text-muted-foreground border-border hover:border-primary/40'
                )}
              >
                {task.status === s.value && (
                  <CheckCircle2 className="inline h-3 w-3 mr-1" />
                )}
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            className="flex-col h-14 gap-1 text-xs"
            onClick={() => setShowDateSheet(true)}
          >
            <Calendar className="h-4 w-4" />
            Move Date
          </Button>
          <Button
            variant="outline"
            className="flex-col h-14 gap-1 text-xs"
            onClick={() => setShowCommentSheet(true)}
          >
            <MessageSquare className="h-4 w-4" />
            Comment
          </Button>
          {isOwner && (
            <Button
              variant="outline"
              className="flex-col h-14 gap-1 text-xs"
              onClick={() => setShowVisSheet(true)}
            >
              {isOrgTask ? <Lock className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
              {isOrgTask ? 'Make Private' : 'Share'}
            </Button>
          )}
        </div>

        {/* Activity Timeline */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Activity
          </p>
          {!task.activityLog || task.activityLog.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No activity yet.
            </p>
          ) : (
            <div className="relative pl-6">
              {/* Vertical line */}
              <div className="absolute left-[9px] top-1 bottom-1 w-px bg-border" />

              <div className="space-y-4">
                {task.activityLog.map((entry) => {
                  const config =
                    ACTIVITY_CONFIG[entry.activityType] ?? ACTIVITY_CONFIG['Updated'];
                  const timeAgo = formatDistanceToNow(parseISO(entry.createdAt), {
                    addSuffix: true,
                  });
                  const exactTime = format(parseISO(entry.createdAt), 'd MMM, h:mm a');

                  return (
                    <div key={entry.id} className="flex gap-3">
                      <div
                        className={cn(
                          "absolute left-0 flex h-[18px] w-[18px] items-center justify-center rounded-full shrink-0 z-10",
                          config.color
                        )}
                      >
                        {config.icon}
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-medium text-foreground">
                            {config.label(entry)}
                            {isOrgTask &&
                              entry.performedByUsername !== 'System' && (
                                <span className="text-muted-foreground font-normal">
                                  {' '}· {entry.performedByUsername}
                                </span>
                              )}
                          </p>
                          <span
                            className="text-[10px] text-muted-foreground shrink-0"
                            title={exactTime}
                          >
                            {timeAgo}
                          </span>
                        </div>
                        {entry.comment && (
                          <div className="mt-1 rounded-lg bg-muted/60 px-2.5 py-1.5">
                            <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                              {entry.comment}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <BottomNav />

      {/* Add Comment sheet */}
      <Sheet open={showCommentSheet} onOpenChange={setShowCommentSheet}>
        <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto rounded-t-xl">
          <SheetHeader className="pb-3">
            <SheetTitle>Add Comment</SheetTitle>
          </SheetHeader>
          <div className="space-y-3 pb-4">
            <Textarea
              placeholder="Add a note or progress update..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[100px] resize-none"
              autoFocus
            />
            <Button
              className="w-full"
              onClick={() => comment.trim() && commentMutation.mutate(comment.trim())}
              disabled={!comment.trim() || commentMutation.isPending}
            >
              {commentMutation.isPending ? 'Saving...' : 'Save Comment'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Move Date sheet */}
      <Sheet open={showDateSheet} onOpenChange={setShowDateSheet}>
        <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto rounded-t-xl">
          <SheetHeader className="pb-3">
            <SheetTitle>Move Target Date</SheetTitle>
          </SheetHeader>
          <div className="space-y-3 pb-4">
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Tomorrow', days: 1 },
                { label: 'In 3 days', days: 3 },
                { label: 'Next week', days: 7 },
              ].map(({ label, days }) => (
                <Button
                  key={label}
                  variant="outline"
                  className="text-xs h-10"
                  onClick={() =>
                    dateMutation.mutate(
                      format(addDays(new Date(), days), 'yyyy-MM-dd')
                    )
                  }
                  disabled={dateMutation.isPending}
                >
                  {label}
                </Button>
              ))}
            </div>
            <DatePickerDrawer value={newDate} onChange={setNewDate} allowFuture />
            <Button
              className="w-full"
              onClick={() => dateMutation.mutate(newDate)}
              disabled={dateMutation.isPending}
            >
              {dateMutation.isPending
                ? 'Moving...'
                : `Move to ${format(parseISO(newDate), 'd MMM')}`}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Visibility sheet */}
      <Sheet open={showVisSheet} onOpenChange={setShowVisSheet}>
        <SheetContent side="bottom" className="max-h-[60vh] overflow-y-auto rounded-t-xl">
          <SheetHeader className="pb-3">
            <SheetTitle>Change Visibility</SheetTitle>
          </SheetHeader>
          <div className="space-y-3 pb-4">
            <p className="text-sm text-muted-foreground">
              {isOrgTask
                ? 'Making this task private will hide it from all team members.'
                : 'Sharing with the organisation will make it visible to all team members.'}
            </p>
            <Button
              className="w-full"
              variant={isOrgTask ? 'outline' : 'default'}
              onClick={() =>
                visMutation.mutate(isOrgTask ? 'Personal' : 'Organisation')
              }
              disabled={visMutation.isPending}
            >
              {visMutation.isPending
                ? 'Updating...'
                : isOrgTask
                ? 'Make Personal (Private)'
                : 'Share with Organisation'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete confirm */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-sm space-y-1">
                <p>
                  <span className="font-medium text-foreground">Task:</span> {task.title}
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
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TaskDetailPage;
