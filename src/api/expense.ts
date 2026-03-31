import apiClient from "./client";
import { dummyExpenses, filterByDate } from "@/lib/dummyData";
import type { Expense, ExpenseFormData, PagedResult } from "@/types";

const USE_DUMMY = false;

export const expenseApi = {
  getAll: async (params?: { startDate?: string; endDate?: string; page?: number; pageSize?: number; category?: string }): Promise<PagedResult<Expense>> => {
    if (USE_DUMMY) {
      const items = filterByDate(dummyExpenses, params?.startDate, params?.endDate);
      return { items, totalCount: items.length, page: 1, pageSize: items.length || 20, totalPages: 1 };
    }
    const { data } = await apiClient.get("/expense", { params });
    return data;
  },
  create: async (expense: ExpenseFormData): Promise<Expense> => {
    if (USE_DUMMY) {
      const newItem: Expense = { id: Date.now().toString(), ...expense, createdAt: new Date().toISOString() };
      dummyExpenses.unshift(newItem);
      return newItem;
    }
    const { data } = await apiClient.post("/expense", expense);
    return data;
  },
  update: async (id: string, expense: ExpenseFormData): Promise<void> => {
    await apiClient.put(`/expense/${id}`, expense);
  },
  delete: async (id: string): Promise<void> => {
    if (USE_DUMMY) {
      const idx = dummyExpenses.findIndex((e) => e.id === id);
      if (idx !== -1) dummyExpenses.splice(idx, 1);
      return;
    }
    await apiClient.delete(`/expense/${id}`);
  },
};
