import { Request, Response } from "express";

import { updateProfile } from "../services/update-profile.service";
import type { UpdateProfileDTO } from "../types/identity.dto.js";

export const updateProfileController = async (
  req: Request<{}, {}, UpdateProfileDTO>,
  res: Response,
): Promise<void> => {
  const updatedUser = await updateProfile(req.user._id.toString(), req.body);

  res.status(200).json({
    success: true,
    message: "Profile updated successfully.",
    data: updatedUser,
  });
};