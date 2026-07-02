import apiClient from "./client";
import type { Task, TaskActivity, DailyNote, TaskSummary, NoteFormData, UpdateNoteFormData } from "@/types";

export const taskApi = {
  getMyTasks: async (params?: {
    view?: string;
    status?: string;
    priority?: string;
    category?: string;
    search?: string;
  }): Promise<Task[]> => {
    const { data } = await apiClient.get("/tasks/my", { params });
    return data;
  },

  getTeamTasks: async (params?: {
    view?: string;
    status?: string;
    priority?: string;
    category?: string;
    search?: string;
  }): Promise<Task[]> => {
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

  changeDate: async (id: string, newDate: string): Promise<void> => {
    await apiClient.patch(`/tasks/${id}/target-date`, { newDate });
  },

  changeVisibility: async (id: string, visibility: string): Promise<void> => {
    await apiClient.patch(`/tasks/${id}/visibility`, { visibility });
  },

  addComment: async (id: string, comment: string): Promise<void> => {
    await apiClient.post(`/tasks/${id}/comments`, { comment });
  },

  deleteTask: async (id: string): Promise<void> => {
    await apiClient.delete(`/tasks/${id}`);
  },

  getNotesByDate: async (date: string): Promise<{ personal: DailyNote[]; orgNotes: DailyNote[] }> => {
    const { data } = await apiClient.get(`/tasks/notes/${date}`);
    return data;
  },

  createNote: async (payload: NoteFormData): Promise<DailyNote> => {
    const { data } = await apiClient.post("/tasks/notes", payload);
    return data;
  },

  updateNote: async (id: string, payload: UpdateNoteFormData): Promise<DailyNote> => {
    const { data } = await apiClient.put(`/tasks/notes/${id}`, payload);
    return data;
  },

  deleteNote: async (id: string): Promise<void> => {
    await apiClient.delete(`/tasks/notes/${id}`);
  },
};
