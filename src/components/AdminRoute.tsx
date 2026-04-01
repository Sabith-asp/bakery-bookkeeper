import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

/**
 * Wraps routes that are only accessible to SuperAdmins.
 * Redirects to "/" for regular org users.
 */
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isSuperAdmin, isLoading } = useAuth();

  if (isLoading) return null;

  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
