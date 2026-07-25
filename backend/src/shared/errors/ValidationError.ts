import { StatusCodes } from "http-status-codes";
import { AppError } from "./AppError";

export class ValidationError extends AppError {
  constructor(
    message = "Validation failed.",
    options?: {
      details?: unknown;
      cause?: unknown;
    },
  ) {
    super(message, StatusCodes.BAD_REQUEST, options);
  }
}