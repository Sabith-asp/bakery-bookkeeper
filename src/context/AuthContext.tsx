import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { AuthState, User } from "@/types";
import { authApi } from "@/api/auth";

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<User> => {
    const data = await authApi.login(username, password);
    const userData: User = {
      id: data.id,
      username: data.username,
      token: data.token,
      role: data.role,
      organizationId: data.organizationId ?? null,
      organizationName: data.organizationName ?? "",
      enabledModules: data.enabledModules ?? [],
    };
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  const isSuperAdmin = user?.role === "SuperAdmin";

  const hasModule = useCallback(
    (module: string) => {
      if (isSuperAdmin) return true;
      return user?.enabledModules.includes(module) ?? false;
    },
    [user, isSuperAdmin]
  );

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, isSuperAdmin: !!isSuperAdmin, hasModule, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
