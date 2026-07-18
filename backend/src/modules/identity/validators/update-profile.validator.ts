import { z } from "zod";

export const updateProfileSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(2, "First name must be at least 2 characters.")
      .max(50, "First name cannot exceed 50 characters.")
      .optional(),

    lastName: z
      .string()
      .trim()
      .min(2, "Last name must be at least 2 characters.")
      .max(50, "Last name cannot exceed 50 characters.")
      .optional(),

    bio: z
      .string()
      .trim()
      .max(500, "Bio cannot exceed 500 characters.")
      .optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field must be provided."
  );