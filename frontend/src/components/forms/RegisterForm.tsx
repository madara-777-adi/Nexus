import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
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
      const message = await registerUser(data);
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
    <div className="flex flex-col gap-6">
      <div>
        <span className="font-merkur text-neon-lime text-lg block mb-1">
          Join NexusSpace
        </span>
        <h2 className="font-neovision text-3xl tracking-wide text-white">
          CREATE ACCOUNT
        </h2>
      </div>

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

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="register-firstName" className="sr-only">
              First Name
            </label>
            <input
              id="register-firstName"
              type="text"
              placeholder="First Name"
              aria-label="First Name"
              aria-invalid={Boolean(errors.firstName)}
              aria-describedby={errors.firstName ? "reg-fn-error" : undefined}
              {...register("firstName")}
              className="w-full bg-midnight border border-surface-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-neon-lime transition-all"
            />
            {errors.firstName && (
              <span
                id="reg-fn-error"
                className="text-xs text-red-400 mt-1 block"
              >
                {errors.firstName.message}
              </span>
            )}
          </div>
          <div>
            <label htmlFor="register-lastName" className="sr-only">
              Last Name
            </label>
            <input
              id="register-lastName"
              type="text"
              placeholder="Last Name"
              aria-label="Last Name"
              aria-invalid={Boolean(errors.lastName)}
              aria-describedby={errors.lastName ? "reg-ln-error" : undefined}
              {...register("lastName")}
              className="w-full bg-midnight border border-surface-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-neon-lime transition-all"
            />
            {errors.lastName && (
              <span
                id="reg-ln-error"
                className="text-xs text-red-400 mt-1 block"
              >
                {errors.lastName.message}
              </span>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="register-email" className="sr-only">
            Email Address
          </label>
          <input
            id="register-email"
            type="email"
            placeholder="Email Address"
            aria-label="Email Address"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "reg-email-error" : undefined}
            {...register("email")}
            className="w-full bg-midnight border border-surface-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-neon-lime transition-all"
          />
          {errors.email && (
            <span
              id="reg-email-error"
              className="text-xs text-red-400 mt-1 block"
            >
              {errors.email.message}
            </span>
          )}
        </div>

        <div>
          <label htmlFor="register-password" className="sr-only">
            Password
          </label>
          <input
            id="register-password"
            type="password"
            placeholder="Password"
            aria-label="Password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "reg-pwd-error" : undefined}
            {...register("password")}
            className="w-full bg-midnight border border-surface-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-neon-lime transition-all"
          />
          {errors.password && (
            <span
              id="reg-pwd-error"
              className="text-xs text-red-400 mt-1 block"
            >
              {errors.password.message}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-neon-lime text-midnight font-neovision font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity cursor-pointer uppercase tracking-wider mt-2 disabled:opacity-50"
        >
          {isSubmitting ? "Registering..." : "Sign Up"}
        </button>

        {/* Social OAuth Buttons */}
        <SocialAuthButtons />
      </form>
    </div>
  );
}
