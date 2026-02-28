import apiClient from "./client";
import type { DashboardSummary } from "@/types";

export const dashboardApi = {
  getSummary: async (params?: { startDate?: string; endDate?: string }): Promise<DashboardSummary> => {
    const { data } = await apiClient.get("/dashboard/summary", { params });
    return data;
  },
};
