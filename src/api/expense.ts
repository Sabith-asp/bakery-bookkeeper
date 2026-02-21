import apiClient from "./client";
import type { Expense, ExpenseFormData } from "@/types";

export const expenseApi = {
  getAll: async (params?: { startDate?: string; endDate?: string }): Promise<Expense[]> => {
    const { data } = await apiClient.get("/expense", { params });
    return data;
  },
  create: async (expense: ExpenseFormData): Promise<Expense> => {
    const { data } = await apiClient.post("/expense", expense);
    return data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/expense/${id}`);
  },
};
