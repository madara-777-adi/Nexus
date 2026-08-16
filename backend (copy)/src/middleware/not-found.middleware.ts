import { NextFunction, Request, Response } from "express";

import { NotFoundError } from "../shared/errors/NotFoundError";

const notFoundMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  throw new NotFoundError(`Route ${req.originalUrl} not found.`);
};

export default notFoundMiddleware;