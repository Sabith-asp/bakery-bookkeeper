import apiClient from "./client";
import type { Organization, OrgUser } from "@/types";

export const adminApi = {
  getOrganizations: async (): Promise<Organization[]> => {
    const { data } = await apiClient.get("/admin/organizations");
    return data;
  },

  getOrganization: async (id: string): Promise<Organization> => {
    const { data } = await apiClient.get(`/admin/organizations/${id}`);
    return data;
  },

  createOrganization: async (payload: { name: string; slug: string }): Promise<Organization> => {
    const { data } = await apiClient.post("/admin/organizations", payload);
    return data;
  },

  toggleModule: async (orgId: string, moduleName: string, enabled: boolean): Promise<void> => {
    await apiClient.put(`/admin/organizations/${orgId}/modules/${moduleName}`, { enabled });
  },

  setOrgStatus: async (orgId: string, isActive: boolean): Promise<void> => {
    await apiClient.patch(`/admin/organizations/${orgId}/status`, { isActive });
  },

  getOrgUsers: async (orgId: string): Promise<OrgUser[]> => {
    const { data } = await apiClient.get(`/admin/organizations/${orgId}/users`);
    return data;
  },

  createOrgUser: async (
    orgId: string,
    payload: { username: string; password: string; roleId: number }
  ): Promise<OrgUser> => {
    const { data } = await apiClient.post(`/admin/organizations/${orgId}/users`, payload);
    return data;
  },

  deleteOrgUser: async (orgId: string, userId: string): Promise<void> => {
    await apiClient.delete(`/admin/organizations/${orgId}/users/${userId}`);
  },
};
