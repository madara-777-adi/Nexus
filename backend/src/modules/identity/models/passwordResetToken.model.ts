import { Schema, model } from "mongoose";

import { IPasswordResetToken } from "../types/passwordResetToken.types";

const passwordResetTokenSchema = new Schema<IPasswordResetToken>(
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

passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const PasswordResetToken = model<IPasswordResetToken>(
  "ResetPasswordToken",
  passwordResetTokenSchema,
);

export default PasswordResetToken;
