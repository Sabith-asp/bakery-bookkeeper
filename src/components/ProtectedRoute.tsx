import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import LottieLoader from "@/components/LottieLoader";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LottieLoader fullScreen />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
