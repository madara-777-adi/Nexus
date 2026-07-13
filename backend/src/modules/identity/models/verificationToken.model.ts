import { Schema, model } from "mongoose";

import { IVerificationToken } from "../types/verificationToken.types";

const verificationTokenSchema = new Schema<IVerificationToken>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tokenHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

verificationTokenSchema.index(
  {
    expiresAt: 1,
  },
  {
    expireAfterSeconds: 0,
  },
);

const verificationToken = model<IVerificationToken>(
  "VerificationToken",
  verificationTokenSchema,
);

export default verificationToken;