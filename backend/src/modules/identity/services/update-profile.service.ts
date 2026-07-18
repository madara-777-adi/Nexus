import z from "zod";
import User from "../models/user.model";
import { updateProfileSchema } from "../validators/update-profile.validator";

type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const updateProfile = async (
  userId: string,
  data: UpdateProfileInput,
) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found.");
  }

  if (data.firstName !== undefined) {
    user.firstName = data.firstName;
  }

  if (data.lastName !== undefined) {
    user.lastName = data.lastName;
  }

  await user.save();

  return user;
};
