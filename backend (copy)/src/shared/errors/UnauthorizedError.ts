import { StatusCodes } from "http-status-codes";
import { AppError } from "./AppError";
import { ErrorOptions } from "./error.types";

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required.", options?: ErrorOptions) {
    super(message, StatusCodes.UNAUTHORIZED, options);
  }
}
