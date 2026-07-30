import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { authApi } from "../../api/auth.api";
import { ArrowLeft, User, Mail, Shield, Check, Save } from "lucide-react";

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, checkAuth } = useAuth();

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fullName =
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "User Profile";

  const getUserInitials = () => {
    const f = user?.firstName?.[0] || "U";
    const l = user?.lastName?.[0] || "";
    return `${f}${l}`.toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMessage("");

    try {
      // Audit 1.2 Fix: Issue actual backend API call to update profile
      await authApi.updateUserProfile({ firstName, lastName });

      // Refresh AuthContext user state so updated name reflects globally
      if (typeof checkAuth === "function") {
        await checkAuth();
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      setErrorMessage(
        error.response?.data?.message ||
          error.message ||
          "Failed to update profile. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#080A0F] p-6 text-gray-200 md:p-12">
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Header Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 rounded-xl border border-gray-800 bg-[#12141A] px-3.5 py-2 text-xs font-medium text-gray-300 transition-all hover:border-gray-700 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          <span className="font-mono text-xs font-semibold tracking-wider text-gray-500">
            ACCOUNT SETTINGS
          </span>
        </div>

        {/* Profile Card */}
        <div className="space-y-6 rounded-2xl border border-gray-800 bg-[#12141A] p-6 md:p-8">
          {/* User Overview Header */}
          <div className="flex items-center gap-4 border-b border-gray-800/80 pb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#00E5FF]/20 bg-[#00E5FF]/10 text-xl font-bold text-[#00E5FF]">
              {getUserInitials()}
            </div>
            <div>
              <h2 className="text-xl font-medium tracking-tight text-white">
                {fullName}
              </h2>
              <p className="mt-0.5 text-xs text-gray-400">
                Manage your profile details and preferences
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/20 p-3 text-xs font-semibold text-red-400">
              {errorMessage}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* First Name & Last Name Inputs */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  <User className="h-3.5 w-3.5 text-[#00E5FF]" /> First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  className="w-full rounded-xl border border-gray-800 bg-[#181B22] px-4 py-3 text-sm text-white placeholder-gray-600 transition-colors focus:border-[#00E5FF] focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  <User className="h-3.5 w-3.5 text-[#00E5FF]" /> Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  className="w-full rounded-xl border border-gray-800 bg-[#181B22] px-4 py-3 text-sm text-white placeholder-gray-600 transition-colors focus:border-[#00E5FF] focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Email Field (Read-only) */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                <Mail className="h-3.5 w-3.5 text-gray-500" /> Email Address
              </label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full cursor-not-allowed rounded-xl border border-gray-800/60 bg-[#080A0F] px-4 py-3 text-sm text-gray-500 opacity-75"
              />
              <span className="text-[11px] text-gray-600">
                Email address is managed via your authentication provider.
              </span>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between border-t border-gray-800/80 pt-4">
              {saveSuccess ? (
                <span className="flex items-center gap-1.5 text-xs font-medium text-[#BCFF3C]">
                  <Check className="h-4 w-4" /> Profile updated successfully!
                </span>
              ) : (
                <span className="text-xs text-gray-500">
                  Click save to apply changes.
                </span>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#BCFF3C] px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-black transition-all hover:bg-[#aef525] disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>

        {/* Security Info Card */}
        <div className="flex items-start gap-3 rounded-xl border border-gray-800/60 bg-[#12141A] p-5">
          <Shield className="mt-0.5 h-5 w-5 shrink-0 text-[#00E5FF]" />
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-gray-200">
              Security & Privacy
            </h4>
            <p className="text-xs leading-relaxed text-gray-400">
              Your profile data is encrypted and used strictly to personalize
              your learning sessions in NexusSpace.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
