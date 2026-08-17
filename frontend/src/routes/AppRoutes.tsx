import { Routes, Route } from "react-router-dom";
import { HomePage } from "../pages/HomePage";
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { VerifyEmailPage } from "../pages/auth/VerifyEmailPage";
import { ForgotPasswordPage } from "../pages/auth/ForgotPasswordPage"
import { ResetPasswordPage } from "../pages/auth/ResetPasswordPage";
import { Dashboard } from "../pages/dashboard/DashboardPage";
import { ProfilePage } from "../pages/profile/ProfilePage";
import { ProtectedRoute } from "../components/common/ProtectedRoute";
import { WorkspacePage } from "../pages/workspace/WorkspacePage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { FooterLayout } from "../components/layout/FooterLayout";
import { PrivacyPage } from "../pages/legal/PrivacyPage";
import { TermsPage } from "../pages/legal/TermsPage";
import { SupportPage } from "../pages/legal/SupportPage";

export function AppRoutes() {
  return (
    <Routes>
      {/* Routes with Footer */}
      <Route element={<FooterLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/support" element={<SupportPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* Routes without Footer */}
      <Route element={<ProtectedRoute />}>
        <Route path="/workspace/:workspaceId" element={<WorkspacePage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
