import { Request, Response } from "express";

import { updateProfile } from "../services/update-profile.service";

export const updateProfileController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const updatedUser = await updateProfile(
      req.user._id.toString(),
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong.",
    });
  }
};