import { StatusCodes } from "http-status-codes";
import { AppError } from "./AppError";
import { ErrorOptions } from "./error.types";

export class InternalServerError extends AppError {
  constructor(message = "Internal server error.", options?: ErrorOptions) {
    super(message, StatusCodes.INTERNAL_SERVER_ERROR, options);
  }
}
