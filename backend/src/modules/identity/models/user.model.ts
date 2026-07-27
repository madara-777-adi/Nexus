import { Schema, model } from "mongoose";

import { IUser } from "../types/user.types";

const userSchema = new Schema<IUser>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email address."],
    },

    password: {
      type: String,
      required: false, // Made optional to allow OAuth users without passwords
      minlength: 8,
      select: false,
    },

    passwordHistory: {
      type: [String],
      default: [],
      select: false,
    },

    provider: {
      type: String,
      enum: ["LOCAL", "GOOGLE", "GITHUB"],
      default: "LOCAL",
    },

    googleId: {
      type: String,
      default: null,
      sparse: true, // Sparse allows multiple documents to have 'null' without unique constraint collisions
    },

    githubId: {
      type: String,
      default: null,
      sparse: true,
    },

    avatar: {
      type: String,
      default: null,
    },

    role: {
      type: String,
      enum: ["USER", "ADMIN"],
      default: "USER",
    },

    bio: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    accountStatus: {
      type: String,
      enum: ["PENDING_VERIFICATION", "ACTIVE", "SUSPENDED"],
      default: "PENDING_VERIFICATION",
    },
  },
  {
    timestamps: true,
  },
);

const User = model<IUser>("User", userSchema);

export default User;
