import apiClient from "./client";
import type { Division } from "@/types";

export const divisionApi = {
  getAll: async (): Promise<Division[]> => {
    const { data } = await apiClient.get("/division");
    return data;
  },
  create: async (name: string): Promise<Division> => {
    const { data } = await apiClient.post("/division", { name: name.trim() });
    return data;
  },
  update: async (id: string, name: string): Promise<void> => {
    await apiClient.put(`/division/${id}`, { name: name.trim() });
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/division/${id}`);
  },
};
