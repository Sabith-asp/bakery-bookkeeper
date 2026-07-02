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
      // Restore session immediately so the app is usable
      setUser(JSON.parse(storedUser));
      // Then silently refresh modules from the server (picks up any SuperAdmin changes)
      authApi.me().then((data) => {
        const refreshed: User = {
          ...JSON.parse(storedUser),
          enabledModules: data.enabledModules ?? [],
          organizationName: data.organizationName ?? "",
          organizationTimezone: data.organizationTimezone ?? "",
        };
        localStorage.setItem("user", JSON.stringify(refreshed));
        setUser(refreshed);
      }).catch(() => {
        // Token expired or network issue — leave existing session in place
      });
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
      organizationTimezone: data.organizationTimezone ?? "",
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
