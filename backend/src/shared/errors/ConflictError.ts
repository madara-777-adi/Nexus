import { StatusCodes } from "http-status-codes";

import { AppError } from "./AppError";

export class ConflictError extends AppError {
  constructor(
    message = "Resource already exists.",
    options?: {
      details?: unknown;
      cause?: unknown;
    },
  ) {
    super(message, StatusCodes.CONFLICT, options);
  }
}
