import { z } from "zod";

export const verifyEmailSchema = z.object({
  token: z.string().trim().length(64, "Invalid verification Token"),
});
