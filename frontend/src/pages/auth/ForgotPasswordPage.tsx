import { useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../../api/auth.api";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setErrorMessage("");

    try {
      const res = await authApi.forgotPassword({ email });
      setMessage(
        res.message ||
          "If an account with this email exists, password reset instructions have been sent.",
      );
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message ||
          "Failed to request password reset. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-midnight text-white flex items-center justify-center px-4 sm:px-6 py-6 sm:py-8 overflow-x-hidden">
      <div className="w-full max-w-md bg-surface-dark border border-surface-border p-5 sm:p-8 rounded-2xl shadow-xl flex flex-col gap-5 sm:gap-6">
        <div>
          <h1 className="font-neovision text-2xl sm:text-3xl tracking-wider mb-2">
            FORGOT PASSWORD
          </h1>
          <p className="text-xs text-gray-400 leading-relaxed">
            Enter your account email to receive a password reset link.
          </p>
        </div>

        {message && (
          <div className="bg-neon-lime/10 text-neon-lime border border-neon-lime/30 p-3 sm:p-4 rounded-xl text-xs font-semibold break-words">
            {message}
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-500/20 text-red-400 border border-red-500/30 p-3 sm:p-4 rounded-xl text-xs font-semibold break-words">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400 font-medium">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@example.com"
              className="bg-surface-border/30 border border-surface-border text-white text-sm rounded-xl p-3 min-h-[44px] focus:outline-none focus:border-neon-lime transition-colors w-full"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full bg-neon-lime text-midnight font-neovision font-bold py-3.5 min-h-[44px] rounded-xl hover:opacity-90 transition-opacity cursor-pointer uppercase tracking-wider disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="text-center pt-2">
          <Link
            to="/login"
            className="text-xs text-gray-400 hover:text-white transition-colors inline-flex items-center min-h-[44px] px-2"
          >
            &larr; Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
