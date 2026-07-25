import { NextFunction, Request, Response } from "express";

import logger from "../shared/logger/logger";
import { AppError } from "../shared/errors/AppError";
import { success } from "zod";

export function errorMiddleware(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  logger.error(
    {
      err: error,
      method: req.method,
      url: req.originalUrl,
    },
    "Request failed",
  );
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      details: error.details,
    });
  }
  return res.status(500).json({
    success: false,
    message: "Something went wrong.",
  });
}
