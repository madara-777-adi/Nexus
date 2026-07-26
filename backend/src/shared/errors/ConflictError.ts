import { StatusCodes } from "http-status-codes";
import { AppError } from "./AppError";
import { ErrorOptions } from "./error.types";
export class ConflictError extends AppError {
  constructor(message = "Resource already exists.", options?: ErrorOptions) {
    super(message, StatusCodes.CONFLICT, options);
  }
}
