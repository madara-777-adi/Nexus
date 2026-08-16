import { StatusCodes } from "http-status-codes";
import { AppError } from "./AppError";
import { ErrorOptions } from "./error.types";

export class NotFoundError extends AppError {
  constructor(message = "Resource not found.", options?: ErrorOptions) {
    super(message, StatusCodes.NOT_FOUND, options);
  }
}
