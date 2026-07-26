import { StatusCodes } from "http-status-codes";
import { AppError } from "./AppError";
import { ErrorOptions } from "./error.types";

export class ValidationError extends AppError {
  constructor(message = "Validation failed.", options?: ErrorOptions) {
    super(message, StatusCodes.BAD_REQUEST, options);
  }
}
