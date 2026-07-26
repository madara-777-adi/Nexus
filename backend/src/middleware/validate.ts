import { Request, Response, NextFunction } from "express";

import {  ZodSchema } from "zod";
import { ValidationError } from "../shared/errors/ValidationError";

const validate = (
  schema: ZodSchema,
  source: "body" | "params" | "query" = "body",
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      throw new ValidationError("Validation failed.", {
        details: result.error.issues,
      });
    }
    req[source] = result.data;
    next();
  };
};

export default validate;
