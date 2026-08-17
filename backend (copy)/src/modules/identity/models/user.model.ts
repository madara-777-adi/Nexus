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
      unique: true,
      sparse: true, // Sparse allows multiple nulls while unique prevents dual account collisions
    },

    githubId: {
      type: String,
      unique: true,
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

    tokenVersion: {
      type: Number,
      default: 0,
    },

    accountStatus: {
      type: String,
      enum: ["PENDING_VERIFICATION", "ACTIVE", "SUSPENDED"],
      default: "PENDING_VERIFICATION",
    },

    termsAcceptedAt: {
      type: Date,
      default: null,
    },

    privacyPolicyAcceptedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const User = model<IUser>("User", userSchema);

export default User;
