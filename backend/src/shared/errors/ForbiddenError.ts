import { StatusCodes } from "http-status-codes";
import { AppError } from "./AppError";

export class ForbiddenError extends AppError {
  constructor(
    message = "You are not allowed to perform this action.",
    options?: {
      details?: unknown;
      cause?: unknown;
    },
  ) {
    super(message, StatusCodes.FORBIDDEN, options);
  }
}