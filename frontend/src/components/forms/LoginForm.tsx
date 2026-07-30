import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../../contexts/AuthContext";
import { SocialAuthButtons } from "./SocialAuthButtons";
import { loginSchema, type LoginFormData } from "../../utils/auth.schemas";

export function LoginForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Catch OAuth redirect errors from backend query params
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "google_auth_failed") {
      setErrorMessage("Google authentication failed. Please try again.");
    } else if (errorParam === "github_auth_failed") {
      setErrorMessage("GitHub authentication failed. Please try again.");
    } else if (errorParam === "oauth_processing_failed") {
      setErrorMessage("Could not complete social sign-in. Please try again.");
    }
  }, [searchParams]);

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setErrorMessage("");

    try {
      // 1. Pass credentials directly to AuthContext login
      await login(data);

      // 2. Navigate straight to Dashboard upon success
      navigate("/dashboard");
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message ||
          err.message ||
          "Invalid email or password.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 w-full">
      <h1 className="font-neovision text-3xl text-white tracking-wider mb-2">
        SIGN IN
      </h1>

      {errorMessage && (
        <div className="bg-red-500/20 text-red-400 border border-red-500/30 p-3 rounded-xl text-xs font-semibold">
          {errorMessage}
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-400 font-medium">
          Email Address
        </label>
        <input
          type="email"
          {...register("email")}
          placeholder="name@example.com"
          className="bg-surface-border/30 border border-surface-border text-white text-sm rounded-xl p-3 focus:outline-none focus:border-neon-lime transition-colors"
        />
        {errors.email && (
          <span className="text-[11px] text-red-400 font-medium">
            {errors.email.message}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center">
          <label className="text-xs text-gray-400 font-medium">Password</label>
          <Link
            to="/forgot-password"
            className="text-xs text-neon-lime hover:underline transition-all"
          >
            Forgot password?
          </Link>
        </div>
        <input
          type="password"
          {...register("password")}
          placeholder="••••••••"
          className="bg-surface-border/30 border border-surface-border text-white text-sm rounded-xl p-3 focus:outline-none focus:border-neon-lime transition-colors"
        />
        {errors.password && (
          <span className="text-[11px] text-red-400 font-medium">
            {errors.password.message}
          </span>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-2 bg-neon-lime text-midnight font-neovision font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity cursor-pointer uppercase tracking-wider disabled:opacity-50"
      >
        {loading ? "Signing In..." : "Sign In"}
      </button>

      {/* Social OAuth Buttons */}
      <SocialAuthButtons />
    </form>
  );
}