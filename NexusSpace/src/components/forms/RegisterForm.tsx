import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
        message || "Registration successful! Please check your email.",
      );
      reset();
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed.");
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
        <div className="bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-2.5 rounded-xl text-xs">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="bg-neon-lime/20 text-neon-lime border border-neon-lime/30 px-4 py-2.5 rounded-xl text-xs">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <input
              type="text"
              placeholder="First Name"
              {...register("firstName")}
              className="w-full bg-midnight border border-surface-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-neon-lime transition-all"
            />
            {errors.firstName && (
              <span className="text-xs text-red-400 mt-1 block">
                {errors.firstName.message}
              </span>
            )}
          </div>
          <div>
            <input
              type="text"
              placeholder="Last Name"
              {...register("lastName")}
              className="w-full bg-midnight border border-surface-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-neon-lime transition-all"
            />
            {errors.lastName && (
              <span className="text-xs text-red-400 mt-1 block">
                {errors.lastName.message}
              </span>
            )}
          </div>
        </div>

        <div>
          <input
            type="email"
            placeholder="Email Address"
            {...register("email")}
            className="w-full bg-midnight border border-surface-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-neon-lime transition-all"
          />
          {errors.email && (
            <span className="text-xs text-red-400 mt-1 block">
              {errors.email.message}
            </span>
          )}
        </div>

        <div>
          <input
            type="password"
            placeholder="Password"
            {...register("password")}
            className="w-full bg-midnight border border-surface-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-neon-lime transition-all"
          />
          {errors.password && (
            <span className="text-xs text-red-400 mt-1 block">
              {errors.password.message}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-neon-lime text-midnight font-neovision font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity cursor-pointer uppercase tracking-wider mt-2"
        >
          {isSubmitting ? "Registering..." : "Sign Up"}
        </button>

        {/* Social OAuth Buttons */}
        <SocialAuthButtons />
      </form>
    </div>
  );
}
