import { Navigate, Outlet } from "react-router-dom";

export function ProtectedRoute() {
  const token = localStorage.getItem("accessToken");

  // If no token exists, send user back to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}