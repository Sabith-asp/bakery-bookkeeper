import apiClient from "./client";
import type { DashboardSummary, TrendDataPoint } from "@/types";

export const dashboardApi = {
  getSummary: async (params?: { startDate?: string; endDate?: string }): Promise<DashboardSummary> => {
    const { data } = await apiClient.get("/dashboard/summary", { params });
    return data;
  },
  getTrend: async (months: number): Promise<TrendDataPoint[]> => {
    const { data } = await apiClient.get("/dashboard/trend", { params: { months } });
    return data;
  },
};
