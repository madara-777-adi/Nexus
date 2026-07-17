import { Request, Response } from "express";

const getCurrentUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  res.status(200).json({
    success: true,
    message: "Current user retrieved successfully.",
    data: req.user,
  });
};

export default getCurrentUser;