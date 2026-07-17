import { Router } from "express";

import authController from "../controllers/auth.controller";

import validate from "../../../middleware/validate";

import {
  forgotPasswordSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
} from "../validators/auth.validator";

import { verifyEmailSchema } from "../validators/verifyEmail.validator";

import { loginSchema } from "../validators/login.validator";

import { refreshTokenRequestSchema } from "../validators/refresh-token.validator";

import { logoutSchema } from "../validators/logout.validator";

import authMiddleware from "../../../middleware/auth.middleware";

import getCurrentUser from "../controllers/me.controller";

const authRoutes = Router();

authRoutes.post("/register", validate(registerSchema), authController.register);

authRoutes.get(
  "/verify-email/:token",
  validate(verifyEmailSchema, "params"),
  authController.verifyEmail,
);

authRoutes.post("/login", validate(loginSchema), authController.login);

authRoutes.post(
  "/refresh-token",
  validate(refreshTokenRequestSchema),
  authController.refreshToken,
);

authRoutes.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  authController.forgotPassword,
);

authRoutes.post(
  "/reset-password",
  validate(resetPasswordSchema),
  authController.resetPassword,
);

authRoutes.post(
  "/resend-verification",
  validate(resendVerificationSchema),
  authController.resendVerification,
);

authRoutes.get("/me", authMiddleware, getCurrentUser);

authRoutes.post(
  "/logout",
  authMiddleware,
  validate(logoutSchema),
  authController.logout,
);

export default authRoutes;
