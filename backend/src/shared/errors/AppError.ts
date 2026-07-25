export abstract class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: unknown;
  public override readonly cause?: unknown;

  constructor(
    message: string,
    statusCode: number,
    options: {
      details?: unknown;
      cause?: unknown;
      isOperational?: boolean;
    } = {},
  ) {
    super(message, { cause: options?.cause });
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = options?.isOperational ?? true;
    this.details = options?.details;

    Error.captureStackTrace?.(this, this.constructor);
  }
}
