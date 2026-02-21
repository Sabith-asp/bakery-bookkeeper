import apiClient from "./client";
import type { Wage, WageFormData } from "@/types";

export const wageApi = {
  getAll: async (params?: { startDate?: string; endDate?: string }): Promise<Wage[]> => {
    const { data } = await apiClient.get("/wage", { params });
    return data;
  },
  create: async (wage: WageFormData): Promise<Wage> => {
    const { data } = await apiClient.post("/wage", wage);
    return data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/wage/${id}`);
  },
};
