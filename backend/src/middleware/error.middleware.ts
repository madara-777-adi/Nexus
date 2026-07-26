import { NextFunction, Request, Response } from "express";

import logger from "../shared/logger/logger";
import { AppError } from "../shared/errors/AppError";
import { InternalServerError } from "../shared/errors/InternalServerError";
import { ValidationError } from "../shared/errors/ValidationError";

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
    if (error instanceof ValidationError) {
      return res.status(error.statusCode).json({
        success: false,
        errors: error.details,
      });
    }

    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      details: error.details,
    });
  }

  const internalServerError = new InternalServerError("Something went wrong.", {
    cause: error,
  });

  return res.status(internalServerError.statusCode).json({
    success: false,
    message: internalServerError.message,
  });
}
