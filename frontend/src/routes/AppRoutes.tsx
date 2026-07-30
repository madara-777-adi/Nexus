import { Routes, Route } from "react-router-dom";
import { HomePage } from "../pages/HomePage";
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { VerifyEmailPage } from "../pages/auth/VerifyEmailPage";
import { Dashboard } from "../pages/dashboard/DashboardPage";
import { ProfilePage } from "../pages/profile/ProfilePage";
import { ProtectedRoute } from "../components/common/ProtectedRoute";
import { WorkspacePage } from "../pages/workspace/WorkspacePage";
import { NotFoundPage } from "../pages/NotFoundPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/workspace/:workspaceId" element={<WorkspacePage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/*
        Catch-all: any future path mismatch (or a stale/bookmarked link)
        renders a visible 404 instead of silently rendering blank.
      */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}