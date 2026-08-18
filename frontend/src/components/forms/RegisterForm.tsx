import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { User, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import {
  registerSchema,
  type RegisterFormData,
} from "../../utils/auth.schemas";
import { useAuth } from "../../contexts/AuthContext";
import { SocialAuthButtons } from "./SocialAuthButtons";

export function RegisterForm() {
  const { register: registerUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const message = await registerUser(
        data as unknown as import("../../api/auth.api").RegisterPayload,
      );
      setSuccessMsg(
        message ||
          "Registration successful! Please check your email to verify your account.",
      );
      reset();
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message || "Registration failed.");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Registration failed.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
          Create your account
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Already registered?{" "}
          <Link
            to="/login"
            className="font-semibold text-neon-lime hover:underline transition"
          >
            Sign in
          </Link>
        </p>
      </div>

      <SocialAuthButtons />

      {error && (
        <div
          role="alert"
          className="bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-2.5 rounded-xl text-xs font-semibold"
        >
          {error}
        </div>
      )}

      {successMsg && (
        <div
          role="status"
          className="bg-neon-lime/10 text-neon-lime border border-neon-lime/30 p-4 rounded-xl text-xs flex flex-col gap-3"
        >
          <p className="font-semibold">{successMsg}</p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center bg-neon-lime text-midnight font-bold py-2.5 px-4 rounded-lg hover:opacity-90 transition-opacity text-xs uppercase tracking-wider text-center"
          >
            Proceed to Sign In &rarr;
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="register-firstName"
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              First Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                id="register-firstName"
                type="text"
                placeholder="Aditya"
                {...register("firstName")}
                className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition"
              />
            </div>
            {errors.firstName && (
              <span className="text-[11px] text-red-400 mt-1 block">
                {errors.firstName.message}
              </span>
            )}
          </div>

          <div>
            <label
              htmlFor="register-lastName"
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              Last Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                id="register-lastName"
                type="text"
                placeholder="Upadhyay"
                {...register("lastName")}
                className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition"
              />
            </div>
            {errors.lastName && (
              <span className="text-[11px] text-red-400 mt-1 block">
                {errors.lastName.message}
              </span>
            )}
          </div>
        </div>

        {/* Email Field */}
        <div>
          <label
            htmlFor="register-email"
            className="block text-xs font-medium text-slate-300 mb-1.5"
          >
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              id="register-email"
              type="email"
              placeholder="you@example.com"
              {...register("email")}
              className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition"
            />
          </div>
          {errors.email && (
            <span className="text-[11px] text-red-400 mt-1 block">
              {errors.email.message}
            </span>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label
            htmlFor="register-password"
            className="block text-xs font-medium text-slate-300 mb-1.5"
          >
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              id="register-password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              {...register("password")}
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
            <span className="text-[11px] text-red-400 mt-1 block">
              {errors.password.message}
            </span>
          )}
        </div>

        {/* Terms Checkbox */}
        <div className="flex items-start gap-2 pt-1">
          <input
            id="register-terms"
            type="checkbox"
            {...register("termsAccepted")}
            className="mt-0.5 h-4 w-4 rounded border-surface-border bg-midnight text-neon-lime focus:ring-neon-lime"
          />
          <label
            htmlFor="register-terms"
            className="text-xs text-gray-400 leading-relaxed"
          >
            I agree to the{" "}
            <Link
              to="/terms"
              className="text-neon-lime hover:underline"
              target="_blank"
            >
              Terms of Use
            </Link>{" "}
            and acknowledge the{" "}
            <Link
              to="/privacy"
              className="text-neon-lime hover:underline"
              target="_blank"
            >
              Privacy Policy
            </Link>
            .
          </label>
        </div>
        {errors.termsAccepted && (
          <span className="text-xs text-red-400 block">
            {errors.termsAccepted.message}
          </span>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-2 bg-neon-lime text-midnight hover:bg-[#a8eb2a] font-bold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm shadow-[0_0_20px_rgba(188,255,60,0.25)] hover:shadow-[0_0_25px_rgba(188,255,60,0.4)] disabled:opacity-50 cursor-pointer uppercase tracking-wider"
        >
          <span>{isSubmitting ? "Creating Account..." : "Get Started"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
