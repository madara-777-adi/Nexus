import { Request, Response, NextFunction } from "express";

import {  ZodSchema } from "zod";

const validate = (
  schema: ZodSchema,
  source: "body" | "params" | "query" = "body",
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      res.status(400).json({
        success: false,
        errors: result.error.issues,
      });
      return;
    }
    req[source] = result.data;
    next();
  };
};

export default validate;
