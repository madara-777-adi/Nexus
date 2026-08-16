import User from "../models/user.model";
import { NotFoundError } from "../../../shared/errors/NotFoundError";
import type { UpdateProfileDTO } from "../types/identity.dto.js";

export const updateProfile = async (userId: string, data: UpdateProfileDTO) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new NotFoundError("User not found.");
  }

  if (data.firstName !== undefined) {
    user.firstName = data.firstName;
  }

  if (data.lastName !== undefined) {
    user.lastName = data.lastName;
  }

  if (data.bio !== undefined) {
    user.bio = data.bio;
  }

  await user.save();

  return user;
};
