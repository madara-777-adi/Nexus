import { z } from "zod";

const nameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters long.")
  .max(50, "Name cannot exceed 50 characters.");

const emailSchema = z
  .string()
  .email("Please enter a valid email address.")
  .trim()
  .toLowerCase();

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long.")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
  .regex(/[0-9]/, "Password must contain at least one number.")
  .regex(
    /[^A-Za-z0-9]/,
    "Password must contain at least one special character.",
  );

const tokenSchema = z.string().trim().min(1, "Token is required.");

export const registerSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: tokenSchema,
  password: passwordSchema,
});

export const resendVerificationSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
});
