import apiClient from "./client";
import type { Employee } from "@/types";

const USE_DUMMY = false;

const dummyEmployees: Employee[] = [
  { id: "1", name: "Rahul Kumar", createdAt: "2026-02-21" },
  { id: "2", name: "Suresh Patel", createdAt: "2026-02-21" },
  { id: "3", name: "Amit Singh", createdAt: "2026-02-20" },
];

export const employeeApi = {
  getAll: async (): Promise<Employee[]> => {
    if (USE_DUMMY) return [...dummyEmployees].sort((a, b) => a.name.localeCompare(b.name));
    const { data } = await apiClient.get("/employee");
    return data;
  },
  update: async (id: string, name: string): Promise<void> => {
    await apiClient.put(`/employee/${id}`, { name: name.trim() });
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/employee/${id}`);
  },
  create: async (name: string): Promise<Employee> => {
    if (USE_DUMMY) {
      const newEmployee: Employee = {
        id: Date.now().toString(),
        name: name.trim(),
        createdAt: new Date().toISOString(),
      };
      dummyEmployees.push(newEmployee);
      return newEmployee;
    }
    const { data } = await apiClient.post("/employee", { name: name.trim() });
    return data;
  },
};
