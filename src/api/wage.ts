import apiClient from "./client";
import { dummyWages, filterByDate } from "@/lib/dummyData";
import type { Wage, WageFormData, PagedResult } from "@/types";

const USE_DUMMY = false;

export const wageApi = {
  getAll: async (params?: { startDate?: string; endDate?: string; page?: number; pageSize?: number }): Promise<PagedResult<Wage>> => {
    if (USE_DUMMY) {
      const items = filterByDate(dummyWages, params?.startDate, params?.endDate);
      return { items, totalCount: items.length, page: 1, pageSize: items.length || 20, totalPages: 1 };
    }
    const { data } = await apiClient.get("/wage", { params });
    return data;
  },
  create: async (wage: WageFormData): Promise<Wage> => {
    if (USE_DUMMY) {
      const newItem: Wage = {
        id: Date.now().toString(),
        ...wage,
        employeeName: "Employee",
        createdAt: new Date().toISOString(),
      };
      dummyWages.unshift(newItem);
      return newItem;
    }
    const { data } = await apiClient.post("/wage", wage);
    return data;
  },
  update: async (id: string, wage: WageFormData): Promise<void> => {
    await apiClient.put(`/wage/${id}`, wage);
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
