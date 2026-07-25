import { StatusCodes } from "http-status-codes";
import { AppError } from "./AppError";

export class InternalServerError extends AppError {
  constructor(
    message = "Internal server error.",
    options?: {
      details?: unknown;
      cause?: unknown;
    },
  ) {
    super(message, StatusCodes.INTERNAL_SERVER_ERROR, options);
  }
}