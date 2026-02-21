import apiClient from "./client";

export const authApi = {
  login: async (username: string, password: string) => {
    const { data } = await apiClient.post("/auth/login", { username, password });
    return data;
  },
};
