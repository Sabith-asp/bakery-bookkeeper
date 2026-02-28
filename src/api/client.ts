import axios from "axios";
import { beginApiRequest, endApiRequest } from "@/state/apiLoading";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  beginApiRequest();
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  endApiRequest();
  return Promise.reject(error);
});

apiClient.interceptors.response.use(
  (response) => {
    endApiRequest();
    return response;
  },
  (error) => {
    endApiRequest();
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
