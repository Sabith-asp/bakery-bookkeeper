import apiClient from "./client";
import type {
  PrayerDashboardResponse,
  PrayerHistoryDay,
  PrayerRecord,
  PrayerStreak,
  PrayerReminderConfig,
  PrayerOrgSettings,
  PrayerUserSettings,
  PrayerAdminSummary,
} from "@/types";

export const prayerApi = {
  getDashboard: async (): Promise<PrayerDashboardResponse> => {
    const { data } = await apiClient.get("/prayer/dashboard");
    return data;
  },

  getHistory: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<PrayerHistoryDay[]> => {
    const { data } = await apiClient.get("/prayer/history", { params });
    return data;
  },

  updateStatus: async (
    id: string,
    payload: { status: string; congregationType?: string; notes?: string }
  ): Promise<PrayerRecord> => {
    const { data } = await apiClient.patch(`/prayer/${id}/status`, payload);
    return data;
  },

  getStreak: async (): Promise<PrayerStreak | null> => {
    const { data } = await apiClient.get("/prayer/streak");
    return data;
  },

  getReminders: async (): Promise<PrayerReminderConfig[]> => {
    const { data } = await apiClient.get("/prayer/reminders");
    return data;
  },

  updateReminder: async (payload: {
    prayerName: string;
    reminderType: string;
    minutesOffset: number;
    isEnabled: boolean;
  }): Promise<void> => {
    await apiClient.put("/prayer/reminders", payload);
  },

  getOrgSettings: async (): Promise<PrayerOrgSettings> => {
    const { data } = await apiClient.get("/prayer/org-settings");
    return data;
  },

  updateOrgSettings: async (payload: {
    latitude: number;
    longitude: number;
    timezone: string;
    calculationMethod: string;
    asrMethod: string;
    fajrAngle: number;
    ishaAngle: number;
  }): Promise<void> => {
    await apiClient.put("/prayer/org-settings", payload);
  },

  getUserLocation: async (): Promise<PrayerUserSettings | null> => {
    const { data } = await apiClient.get("/prayer/user-location");
    return data;
  },

  updateUserLocation: async (payload: {
    latitude?: number;
    longitude?: number;
    timezone?: string;
    cityName?: string;
  }): Promise<void> => {
    await apiClient.put("/prayer/user-location", payload);
  },

  clearUserLocation: async (): Promise<void> => {
    await apiClient.delete("/prayer/user-location");
  },

  getAdminSummary: async (date?: string): Promise<PrayerAdminSummary> => {
    const { data } = await apiClient.get("/prayer/admin/summary", {
      params: date ? { date } : undefined,
    });
    return data;
  },
};
