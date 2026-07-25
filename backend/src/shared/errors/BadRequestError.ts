import { StatusCodes } from "http-status-codes";
import { AppError } from "./AppError";

export class BadRequestError extends AppError {
  constructor(
    message = "Bad request.",
    options?: {
      details?: unknown;
      cause?: unknown;
    },
  ) {
    super(message, StatusCodes.BAD_REQUEST, options);
  }
}