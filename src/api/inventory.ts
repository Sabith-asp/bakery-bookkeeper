import apiClient from "./client";
import type {
  ProductCategory,
  Product,
  StockTransaction,
  InventorySummary,
  PagedResult,
  ProductFormData,
  StockTransactionFormData,
} from "@/types";

export const inventoryApi = {
  // ── Categories ────────────────────────────────────────────────────────────
  getCategories: async (): Promise<ProductCategory[]> => {
    const { data } = await apiClient.get("/inventory/categories");
    return data;
  },
  createCategory: async (name: string): Promise<ProductCategory> => {
    const { data } = await apiClient.post("/inventory/categories", { name });
    return data;
  },
  updateCategory: async (id: string, name: string): Promise<void> => {
    await apiClient.put(`/inventory/categories/${id}`, { name });
  },
  deleteCategory: async (id: string): Promise<void> => {
    await apiClient.delete(`/inventory/categories/${id}`);
  },

  // ── Products ──────────────────────────────────────────────────────────────
  getProducts: async (params?: {
    search?: string;
    categoryId?: string;
    includeInactive?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<PagedResult<Product>> => {
    const { data } = await apiClient.get("/inventory/products", { params });
    return data;
  },
  createProduct: async (product: ProductFormData): Promise<Product> => {
    const { data } = await apiClient.post("/inventory/products", product);
    return data;
  },
  updateProduct: async (id: string, product: ProductFormData): Promise<void> => {
    await apiClient.put(`/inventory/products/${id}`, product);
  },
  setProductStatus: async (id: string, isActive: boolean): Promise<void> => {
    await apiClient.patch(`/inventory/products/${id}/status`, { isActive });
  },

  // ── Transactions ──────────────────────────────────────────────────────────
  getTransactions: async (params?: {
    productId?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PagedResult<StockTransaction>> => {
    const { data } = await apiClient.get("/inventory/transactions", { params });
    return data;
  },
  createTransaction: async (tx: StockTransactionFormData): Promise<StockTransaction> => {
    const { data } = await apiClient.post("/inventory/transactions", tx);
    return data;
  },
  deleteTransaction: async (id: string): Promise<void> => {
    await apiClient.delete(`/inventory/transactions/${id}`);
  },

  // ── Summary ───────────────────────────────────────────────────────────────
  getSummary: async (): Promise<InventorySummary> => {
    const { data } = await apiClient.get("/inventory/summary");
    return data;
  },
  getLowStock: async (): Promise<Product[]> => {
    const { data } = await apiClient.get("/inventory/low-stock");
    return data;
  },
};
