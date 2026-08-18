import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { SocialAuthButtons } from "./SocialAuthButtons";
import { loginSchema, type LoginFormData } from "../../utils/auth.schemas";

export function LoginForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

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
      await login(data);
      navigate("/dashboard");
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        setErrorMessage(
          err.response?.data?.message || "Invalid email or password.",
        );
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Invalid email or password.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
          Welcome back
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-neon-lime hover:underline transition"
          >
            Sign up
          </Link>
        </p>
      </div>

      <SocialAuthButtons />

      {errorMessage && (
        <div
          role="alert"
          className="bg-red-500/20 text-red-400 border border-red-500/30 p-3 rounded-xl text-xs font-semibold"
        >
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email Field */}
        <div>
          <label
            htmlFor="login-email"
            className="block text-xs font-medium text-slate-300 mb-1.5"
          >
            Email address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              id="login-email"
              type="email"
              {...register("email")}
              placeholder="you@example.com"
              aria-invalid={Boolean(errors.email)}
              className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition"
            />
          </div>
          {errors.email && (
            <span className="text-[11px] text-red-400 font-medium mt-1 block">
              {errors.email.message}
            </span>
          )}
        </div>

        {/* Password Field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="login-password"
              className="text-xs font-medium text-slate-300"
            >
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs text-neon-lime hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              {...register("password")}
              placeholder="••••••••"
              aria-invalid={Boolean(errors.password)}
              className="w-full glass-input rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <span className="text-[11px] text-red-400 font-medium mt-1 block">
              {errors.password.message}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 bg-neon-lime text-midnight hover:bg-[#a8eb2a] font-bold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm shadow-[0_0_20px_rgba(188,255,60,0.25)] hover:shadow-[0_0_25px_rgba(188,255,60,0.4)] disabled:opacity-50 cursor-pointer uppercase tracking-wider"
        >
          <span>{loading ? "Signing In..." : "Sign In"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
