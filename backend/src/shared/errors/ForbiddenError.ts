import { StatusCodes } from "http-status-codes";
import { AppError } from "./AppError";
import { ErrorOptions } from "./error.types";

export class ForbiddenError extends AppError {
  constructor(
    message = "You are not allowed to perform this action.",
    options?: ErrorOptions,
  ) {
    super(message, StatusCodes.FORBIDDEN, options);
  }
}
