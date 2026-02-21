import apiClient from "./client";
import type { Income, IncomeFormData } from "@/types";

export const incomeApi = {
  getAll: async (params?: { startDate?: string; endDate?: string }): Promise<Income[]> => {
    const { data } = await apiClient.get("/income", { params });
    return data;
  },
  create: async (income: IncomeFormData): Promise<Income> => {
    const { data } = await apiClient.post("/income", income);
    return data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/income/${id}`);
  },
};
