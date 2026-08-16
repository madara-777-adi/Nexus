import { HydratedDocument } from "mongoose";

import { IUser } from "../modules/identity/types/user.types";

declare global {
  namespace Express {
    interface Request {
      user: HydratedDocument<IUser>;
    }
  }
}

export {};
