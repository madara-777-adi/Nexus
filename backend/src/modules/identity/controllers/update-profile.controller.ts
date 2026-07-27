import { Request, Response } from "express";
import { UnauthorizedError } from "../../../shared/errors/UnauthorizedError";
// Adjust this import to match your actual service function path
import { updateProfile } from "../services/update-profile.service";

export async function updateProfileController(req: Request, res: Response) {
  // 1. Guard against undefined req.user (Fixes TS18048)
  if (!req.user) {
    throw new UnauthorizedError("User is not authenticated.");
  }

  // 2. Cast req.user as any or your User interface to access _id (Fixes TS2339)
  const user = req.user as any;
  const updatedUser = await updateProfile(user._id.toString(), req.body);

  return res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: updatedUser,
  });
}
