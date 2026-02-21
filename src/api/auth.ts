import apiClient from "./client";

const USE_DUMMY = true;

export const authApi = {
  login: async (username: string, password: string) => {
    if (USE_DUMMY) {
      return { id: "1", username, token: "dummy-jwt-token" };
    }
    const { data } = await apiClient.post("/auth/login", { username, password });
    return data;
  },
};
