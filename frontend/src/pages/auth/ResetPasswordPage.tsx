import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { authApi } from "../../api/auth.api";

export function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!token) {
      setErrorMessage("Invalid or missing password reset token.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    try {
      const res = await authApi.resetPassword({ token, password });
      setSuccessMessage(
        res.message || "Your password has been reset successfully.",
      );
      setTimeout(() => {
        navigate("/login");
      }, 2500);
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message ||
          "Failed to reset password. The link may have expired.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-midnight text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-dark border border-surface-border p-8 rounded-2xl shadow-xl flex flex-col gap-6">
        <div>
          <h1 className="font-neovision text-3xl tracking-wider mb-2">
            RESET PASSWORD
          </h1>
          <p className="text-xs text-gray-400">
            Enter your new password below.
          </p>
        </div>

        {successMessage && (
          <div className="bg-neon-lime/10 text-neon-lime border border-neon-lime/30 p-4 rounded-xl text-xs font-semibold">
            {successMessage} Redirecting to login...
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-500/20 text-red-400 border border-red-500/30 p-4 rounded-xl text-xs font-semibold">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400 font-medium">
              New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="••••••••"
              className="bg-surface-border/30 border border-surface-border text-white text-sm rounded-xl p-3 focus:outline-none focus:border-neon-lime transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400 font-medium">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              placeholder="••••••••"
              className="bg-surface-border/30 border border-surface-border text-white text-sm rounded-xl p-3 focus:outline-none focus:border-neon-lime transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-neon-lime text-midnight font-neovision font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity cursor-pointer uppercase tracking-wider disabled:opacity-50"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <div className="text-center pt-2">
          <Link
            to="/login"
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            &larr; Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}