import { Request, Response } from "express";
import { toSafeUserDTO } from "../../../shared/utils/toSafeUserDTO";

const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    message: "Current user retrieved successfully.",
    data: toSafeUserDTO(req.user),
  });
};

export default getCurrentUser;
