import apiClient from "./client";
import { dummyExpenses, filterByDate } from "@/lib/dummyData";
import type { Expense, ExpenseFormData } from "@/types";

const USE_DUMMY = false;

export const expenseApi = {
  getAll: async (params?: { startDate?: string; endDate?: string; limit?: number }): Promise<Expense[]> => {
    if (USE_DUMMY) return filterByDate(dummyExpenses, params?.startDate, params?.endDate);
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
  delete: async (id: string): Promise<void> => {
    if (USE_DUMMY) {
      const idx = dummyExpenses.findIndex((e) => e.id === id);
      if (idx !== -1) dummyExpenses.splice(idx, 1);
      return;
    }
    await apiClient.delete(`/expense/${id}`);
  },
};
