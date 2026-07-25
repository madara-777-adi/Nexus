import { StatusCodes } from "http-status-codes";
import { AppError } from "./AppError";

export class NotFoundError extends AppError {
  constructor(
    message = "Resource not found.",
    options?: {
      details?: unknown;
      cause?: unknown;
    },
  ) {
    super(message, StatusCodes.NOT_FOUND, options);
  }
}