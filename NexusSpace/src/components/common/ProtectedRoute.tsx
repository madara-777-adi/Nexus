import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // 1. Wait for AuthContext session check to finish before making a routing decision
  if (loading) {
    return (
      <div className="min-h-screen bg-midnight text-white flex items-center justify-center">
        <div className="text-neon-lime text-sm font-semibold animate-pulse">
          Authenticating...
        </div>
      </div>
    );
  }

  // 2. If session check is complete and user is NOT authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Authenticated successfully — render protected route content
  return <Outlet />;
}