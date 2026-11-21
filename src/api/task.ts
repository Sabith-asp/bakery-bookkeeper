import apiClient from "./client";
import type { Task, TaskActivity, DailyNote, TaskSummary, TaskListPage } from "@/types";

export const taskApi = {
  // `nextCursor` is only ever non-null for the Completed bucket (the "completed" view itself,
  // or the Completed column embedded in the board's "all" view) — every other view returns it
  // as null since those lists stay small by nature and never need a second page.
  getMyTasks: async (params?: {
    view?: string;
    status?: string;
    priority?: string;
    category?: string;
    search?: string;
    before?: string;
    limit?: number;
    needsFollowUp?: boolean;
  }): Promise<TaskListPage> => {
    const { data } = await apiClient.get("/tasks/my", { params });
    return data;
  },

  getTeamTasks: async (params?: {
    view?: string;
    status?: string;
    priority?: string;
    category?: string;
    search?: string;
    before?: string;
    limit?: number;
    needsFollowUp?: boolean;
  }): Promise<TaskListPage> => {
    const { data } = await apiClient.get("/tasks/team", { params });
    return data;
  },

  getSummary: async (): Promise<TaskSummary> => {
    const { data } = await apiClient.get("/tasks/summary");
    return data;
  },

  getById: async (id: string): Promise<Task> => {
    const { data } = await apiClient.get(`/tasks/${id}`);
    return data;
  },

  create: async (payload: {
    title: string;
    description?: string;
    category: string;
    priority: string;
    visibility: string;
    currentTargetDate: string;
    assignedToUserId?: string;
    assignedToUsername?: string;
  }): Promise<Task> => {
    const { data } = await apiClient.post("/tasks", payload);
    return data;
  },

  update: async (id: string, payload: {
    title: string;
    description?: string;
    category: string;
    priority: string;
    assignedToUserId?: string;
    assignedToUsername?: string;
  }): Promise<void> => {
    await apiClient.put(`/tasks/${id}`, payload);
  },

  changeStatus: async (id: string, status: string): Promise<void> => {
    await apiClient.patch(`/tasks/${id}/status`, { status });
  },

  // scope: "my" (private order, only you see it) or "team" (shared order, visible to the whole org)
  reorder: async (scope: 'my' | 'team', orderedTaskIds: string[]): Promise<void> => {
    await apiClient.patch(`/tasks/reorder`, { scope, orderedTaskIds });
  },

  changeDate: async (id: string, newDate: string): Promise<void> => {
    await apiClient.patch(`/tasks/${id}/target-date`, { newDate });
  },

  changePriority: async (id: string, priority: string): Promise<void> => {
    await apiClient.patch(`/tasks/${id}/priority`, { priority });
  },

  changeVisibility: async (id: string, visibility: string): Promise<void> => {
    await apiClient.patch(`/tasks/${id}/visibility`, { visibility });
  },

  setFollowUp: async (id: string, payload: { needsFollowUp: boolean; followUpDate?: string; followUpNotes?: string }): Promise<void> => {
    await apiClient.patch(`/tasks/${id}/follow-up`, payload);
  },

  resolveFollowUp: async (id: string): Promise<void> => {
    await apiClient.patch(`/tasks/${id}/follow-up/resolve`);
  },

  addComment: async (id: string, comment: string): Promise<void> => {
    await apiClient.post(`/tasks/${id}/comments`, { comment });
  },

  deleteTask: async (id: string): Promise<void> => {
    await apiClient.delete(`/tasks/${id}`);
  },

  getNotesByDate: async (date: string, includeOrg = true): Promise<{ personal: DailyNote | null; orgNotes: DailyNote[] }> => {
    const { data } = await apiClient.get(`/tasks/notes/${date}`, { params: { includeOrg } });
    return data;
  },

  getRecentNotes: async (limit = 7): Promise<DailyNote[]> => {
    const { data } = await apiClient.get("/tasks/notes/recent", { params: { limit } });
    return data;
  },

  upsertNote: async (date: string, content: string, visibility = "Personal"): Promise<DailyNote> => {
    const { data } = await apiClient.put(`/tasks/notes/${date}`, { content, visibility });
    return data;
  },

  deleteNote: async (date: string): Promise<void> => {
    await apiClient.delete(`/tasks/notes/${date}`);
  },
};
