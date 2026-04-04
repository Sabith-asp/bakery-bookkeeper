import apiClient from "./client";
import type { Debt, DebtPayment, DebtFormData, DebtPaymentFormData } from "@/types";

export const debtApi = {
  getAll: async (params?: { type?: "Payable" | "Receivable"; settled?: boolean }): Promise<Debt[]> => {
    const { data } = await apiClient.get("/debts", { params });
    return data;
  },

  getById: async (id: string): Promise<Debt> => {
    const { data } = await apiClient.get(`/debts/${id}`);
    return data;
  },

  create: async (payload: DebtFormData): Promise<Debt> => {
    const { data } = await apiClient.post("/debts", payload);
    return data;
  },

  update: async (id: string, payload: DebtFormData): Promise<void> => {
    await apiClient.put(`/debts/${id}`, payload);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/debts/${id}`);
  },

  addPayment: async (debtId: string, payload: DebtPaymentFormData): Promise<DebtPayment> => {
    const { data } = await apiClient.post(`/debts/${debtId}/payments`, payload);
    return data;
  },

  deletePayment: async (debtId: string, paymentId: string): Promise<void> => {
    await apiClient.delete(`/debts/${debtId}/payments/${paymentId}`);
  },

  settle: async (id: string): Promise<void> => {
    await apiClient.patch(`/debts/${id}/settle`);
  },
};
