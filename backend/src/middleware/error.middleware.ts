import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";

import logger from "../shared/logger/logger";
import { AppError } from "../shared/errors/AppError";
import { InternalServerError } from "../shared/errors/InternalServerError";
import { ValidationError } from "../shared/errors/ValidationError";

const isProduction = process.env.NODE_ENV === "production";

export function errorMiddleware(
  error: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  // 1. Handle Known Domain Application Errors
  if (error instanceof AppError) {
    if (error instanceof ValidationError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message || "Validation Error",
        details: error.details,
        ...(isProduction ? {} : { stack: error.stack }),
      });
    }

    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      ...(error.details ? { details: error.details } : {}),
      ...(isProduction ? {} : { stack: error.stack }),
    });
  }

  // 2. Handle Body-Parser JSON Syntax Errors
  if (
    error instanceof SyntaxError &&
    "status" in error &&
    (error as any).status === 400
  ) {
    return res.status(400).json({
      success: false,
      message: "Malformed JSON payload provided.",
      ...(isProduction ? {} : { stack: error.stack }),
    });
  }

  // 3. Handle Mongoose CastError (Malformed ObjectIds)
  if (error instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      success: false,
      message: `Invalid format for resource identifier: '${error.value}'.`,
      field: error.path,
      ...(isProduction ? {} : { stack: error.stack }),
    });
  }

  // 4. Handle Mongoose Schema Validation Errors
  if (error instanceof mongoose.Error.ValidationError) {
    const details = Object.values(error.errors).map((err) => ({
      field: err.path,
      message: err.message,
    }));

    return res.status(400).json({
      success: false,
      message: "Database schema validation failed.",
      details,
      ...(isProduction ? {} : { stack: error.stack }),
    });
  }

  // 5. Handle MongoDB Duplicate Key Errors (Code 11000)
  if ((error as any).code === 11000) {
    const keyValue = (error as any).keyValue;
    const duplicatedField = keyValue ? Object.keys(keyValue)[0] : "field";
    const duplicatedValue = keyValue ? keyValue[duplicatedField] : "";

    return res.status(409).json({
      success: false,
      message: `A record with this ${duplicatedField} ('${duplicatedValue}') already exists.`,
      ...(isProduction ? {} : { stack: error.stack }),
    });
  }

  // 6. Fallback for Unhandled Internal Server Errors
  const internalServerError = new InternalServerError("Something went wrong.", {
    cause: error,
  });

  return res.status(internalServerError.statusCode).json({
    success: false,
    message: internalServerError.message,
    ...(isProduction ? {} : { stack: error.stack, rawError: error.message }),
  });
}
