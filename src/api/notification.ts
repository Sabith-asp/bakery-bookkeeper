import apiClient from "./client";
import type { NotificationSettings } from "@/types";

export const notificationApi = {
  getVapidPublicKey: async (): Promise<string> => {
    const { data } = await apiClient.get("/notifications/vapid-public-key");
    return data.key;
  },

  subscribe: async (subscription: PushSubscription): Promise<void> => {
    const json = subscription.toJSON();
    await apiClient.post("/notifications/subscribe", {
      endpoint: json.endpoint,
      p256dh: json.keys?.p256dh ?? "",
      auth: json.keys?.auth ?? "",
    });
  },

  unsubscribe: async (endpoint: string): Promise<void> => {
    await apiClient.delete("/notifications/subscribe", { data: { endpoint } });
  },

  getSettings: async (): Promise<NotificationSettings> => {
    const { data } = await apiClient.get("/notifications/settings");
    return data;
  },

  updateSettings: async (settings: Omit<NotificationSettings, "orgId">): Promise<NotificationSettings> => {
    const { data } = await apiClient.put("/notifications/settings", settings);
    return data;
  },

  sendTest: async (): Promise<void> => {
    await apiClient.post("/notifications/test");
  },
};
