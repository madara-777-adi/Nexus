import { StatusCodes } from "http-status-codes";
import { AppError } from "./AppError";

export class UnauthorizedError extends AppError {
  constructor(
    message = "Authentication required.",
    options?: {
      details?: unknown;
      cause?: unknown;
    },
  ) {
    super(message, StatusCodes.UNAUTHORIZED, options);
  }
}