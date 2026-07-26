import { StatusCodes } from "http-status-codes";
import { AppError } from "./AppError";
import { ErrorOptions } from "./error.types";

export class BadRequestError extends AppError {
  constructor(message = "Bad request.", options?: ErrorOptions) {
    super(message, StatusCodes.BAD_REQUEST, options);
  }
}
