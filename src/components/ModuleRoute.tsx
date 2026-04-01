import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface ModuleRouteProps {
  module: string;
  children: React.ReactNode;
}

/**
 * Wraps a route that requires a specific module to be enabled for the
 * current user's organization. Redirects to "/" if the module is off.
 */
const ModuleRoute = ({ module, children }: ModuleRouteProps) => {
  const { hasModule, isLoading } = useAuth();

  if (isLoading) return null;

  if (!hasModule(module)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ModuleRoute;
