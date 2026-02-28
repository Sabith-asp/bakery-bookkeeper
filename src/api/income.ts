import apiClient from "./client";
import { dummyIncomes, filterByDate } from "@/lib/dummyData";
import type { Income, IncomeFormData } from "@/types";

const USE_DUMMY = false;

export const incomeApi = {
  getAll: async (params?: { startDate?: string; endDate?: string; limit?: number }): Promise<Income[]> => {
    if (USE_DUMMY) return filterByDate(dummyIncomes, params?.startDate, params?.endDate);
    const { data } = await apiClient.get("/income", { params });
    return data;
  },
  create: async (income: IncomeFormData): Promise<Income> => {
    if (USE_DUMMY) {
      const newItem: Income = { id: Date.now().toString(), ...income, createdAt: new Date().toISOString() };
      dummyIncomes.unshift(newItem);
      return newItem;
    }
    const { data } = await apiClient.post("/income", income);
    return data;
  },
  delete: async (id: string): Promise<void> => {
    if (USE_DUMMY) {
      const idx = dummyIncomes.findIndex((i) => i.id === id);
      if (idx !== -1) dummyIncomes.splice(idx, 1);
      return;
    }
    await apiClient.delete(`/income/${id}`);
  },
};
