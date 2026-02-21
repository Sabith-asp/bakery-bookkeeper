import apiClient from "./client";
import { dummyWages, filterByDate } from "@/lib/dummyData";
import type { Wage, WageFormData } from "@/types";

const USE_DUMMY = true;

export const wageApi = {
  getAll: async (params?: { startDate?: string; endDate?: string }): Promise<Wage[]> => {
    if (USE_DUMMY) return filterByDate(dummyWages, params?.startDate, params?.endDate);
    const { data } = await apiClient.get("/wage", { params });
    return data;
  },
  create: async (wage: WageFormData): Promise<Wage> => {
    if (USE_DUMMY) {
      const newItem: Wage = { id: Date.now().toString(), ...wage, createdAt: new Date().toISOString() };
      dummyWages.unshift(newItem);
      return newItem;
    }
    const { data } = await apiClient.post("/wage", wage);
    return data;
  },
  delete: async (id: string): Promise<void> => {
    if (USE_DUMMY) {
      const idx = dummyWages.findIndex((w) => w.id === id);
      if (idx !== -1) dummyWages.splice(idx, 1);
      return;
    }
    await apiClient.delete(`/wage/${id}`);
  },
};
