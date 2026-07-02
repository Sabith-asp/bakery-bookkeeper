import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { format } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { taskApi } from "@/api/task";
import type { Task } from "@/types";
import { TASK_CATEGORIES } from "@/config/taskCategories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import BottomNav from "@/components/BottomNav";
import DatePickerDrawer from "@/components/DatePickerDrawer";
import SaveSuccessOverlay from "@/components/SaveSuccessOverlay";
import { useToast } from "@/hooks/use-toast";
import { useApiLoading } from "@/state/apiLoading";
import {
  ArrowLeft,
  ClipboardList,
  Check,
  Building2,
  Lock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PRIORITIES = ['High', 'Medium', 'Low'] as const;

const PRIORITY_STYLES: Record<string, string> = {
  High:   'border-destructive/50 bg-destructive/10 text-destructive',
  Medium: 'border-amber-500/50 bg-amber-500/10 text-amber-600',
  Low:    'border-border bg-muted text-muted-foreground',
};

const AddTaskPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const isApiLoading = useApiLoading();

  const editItem = location.state?.item as Task | undefined;
  const defaultDate = location.state?.defaultDate as string | undefined;
  const isEditMode = !!editItem;

  const [title, setTitle] = useState(editItem?.title ?? '');
  const [description, setDescription] = useState(editItem?.description ?? '');
  const [showDesc, setShowDesc] = useState(!!editItem?.description);
  const [category, setCategory] = useState(editItem?.category ?? '');
  const [priority, setPriority] = useState<typeof PRIORITIES[number]>(
    editItem?.priority ?? 'Medium'
  );
  const [visibility, setVisibility] = useState<'Personal' | 'Organisation'>(
    editItem?.visibility ?? 'Personal'
  );
  const [targetDate, setTargetDate] = useState(
    editItem?.currentTargetDate?.slice(0, 10) ??
      defaultDate ??
      format(new Date(), 'yyyy-MM-dd')
  );
  const [showSuccess, setShowSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: (data: Parameters<typeof taskApi.create>[0]) =>
      isEditMode ? taskApi.update(editItem!.id, data) : taskApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks-my'] });
      qc.invalidateQueries({ queryKey: ['tasks-team'] });
      qc.invalidateQueries({ queryKey: ['task-summary'] });
      setShowSuccess(true);
      setTimeout(() => navigate('/tasks'), 900);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description:
          error?.response?.data?.message ??
          (isEditMode ? 'Failed to update task' : 'Failed to create task'),
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({
        title: 'Title required',
        description: 'Enter a task title',
        variant: 'destructive',
      });
      return;
    }
    if (!category) {
      toast({
        title: 'Category required',
        description: 'Select a category',
        variant: 'destructive',
      });
      return;
    }
    mutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      priority,
      visibility,
      currentTargetDate: targetDate,
    });
  };

  return (
    <div className="min-h-screen bg-background pb-40">
      <SaveSuccessOverlay show={showSuccess} />

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-3 border-b border-border/60 bg-card/60 backdrop-blur-sm sticky top-0 z-40">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full shrink-0"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15">
            <ClipboardList className="h-3.5 w-3.5 text-primary" />
          </div>
          <h1 className="text-lg font-bold leading-tight">
            {isEditMode ? 'Edit Task' : 'Add Task'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="px-4 pt-5 space-y-6">

          {/* Visibility toggle */}
          <div className="grid grid-cols-2 rounded-xl border border-border bg-muted/40 p-1 gap-1">
            {(['Personal', 'Organisation'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVisibility(v)}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-semibold transition-all",
                  visibility === v
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground"
                )}
              >
                {v === 'Personal' ? (
                  <Lock className="h-3 w-3" />
                ) : (
                  <Building2 className="h-3 w-3" />
                )}
                {v}
              </button>
            ))}
          </div>
          {visibility === 'Organisation' && (
            <p className="text-xs text-muted-foreground -mt-4 px-1">
              All team members can see and complete this task.
            </p>
          )}

          <div className="h-px bg-border/60" />

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Task Title</label>
            <Input
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={255}
              className="h-11"
              autoFocus={!isEditMode}
            />
          </div>

          {/* Description toggle */}
          <button
            type="button"
            onClick={() => setShowDesc((v) => !v)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showDesc ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
            {showDesc ? 'Hide details' : 'Add details (optional)'}
          </button>
          {showDesc && (
            <Textarea
              placeholder="Add more context, links, or notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] resize-none text-sm"
            />
          )}

          <div className="h-px bg-border/60" />

          {/* Category */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Category</label>
            <div className="flex flex-wrap gap-2">
              {TASK_CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={cn(
                    "flex items-center gap-1 px-3 py-2 text-xs rounded-lg border font-medium transition-all",
                    category === c
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {category === c && <Check className="h-3 w-3 shrink-0" />}
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-border/60" />

          {/* Priority */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Priority</label>
            <div className="flex gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold rounded-lg border transition-all",
                    priority === p
                      ? PRIORITY_STYLES[p] + ' shadow-sm'
                      : "bg-background text-muted-foreground border-border"
                  )}
                >
                  {priority === p && <Check className="h-3 w-3 shrink-0" />}
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-border/60" />

          {/* Target date */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Target Date</label>
            <DatePickerDrawer value={targetDate} onChange={setTargetDate} allowFuture />
          </div>

        </div>
      </form>

      {/* Sticky submit */}
      <div className="fixed bottom-16 left-0 right-0 px-4 pb-3 pt-2 bg-background/95 backdrop-blur-sm border-t border-border/60 z-30">
        <Button
          type="submit"
          className="w-full h-12 text-base font-semibold"
          disabled={mutation.isPending || isApiLoading}
          onClick={handleSubmit}
        >
          {mutation.isPending
            ? 'Saving...'
            : isEditMode
            ? 'Update Task'
            : 'Save Task'}
        </Button>
      </div>

      <BottomNav />
    </div>
  );
};

export default AddTaskPage;
