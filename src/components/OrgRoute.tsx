import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

/**
 * Guards routes that belong to org users only.
 * If a SuperAdmin lands here (e.g. typed "/" manually), they are
 * immediately redirected to /admin, preventing data-endpoint calls
 * that would fail because SuperAdmin has no OrganizationId.
 */
const OrgRoute = ({ children }: { children: React.ReactNode }) => {
  const { isSuperAdmin, isLoading } = useAuth();

  if (isLoading) return null;

  if (isSuperAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};

export default OrgRoute;
