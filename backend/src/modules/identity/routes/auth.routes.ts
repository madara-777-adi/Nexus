import { Router } from "express";

import authController from "../controllers/auth.controller";
import validate from "../../../middleware/validate";
import passport from "../../../config/passport";
import env from "../../../config/env";

import {
  changePasswordSchema,
  deleteAccountSchema,
  forgotPasswordSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
} from "../validators/auth.validator";
import { verifyEmailSchema } from "../validators/verifyEmail.validator";
import { loginSchema } from "../validators/login.validator";
import { updateProfileSchema } from "../validators/update-profile.validator";

import authMiddleware from "../../../middleware/auth.middleware";
import getCurrentUser from "../controllers/me.controller";
import { updateProfileController } from "../controllers/update-profile.controller";
import {
  authLimiter,
  sessionCheckLimiter,
} from "../../../middleware/rateLimiter.middleware";

const authRoutes = Router();

authRoutes.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  authController.register,
);

authRoutes.get(
  "/verify-email/:token",
  validate(verifyEmailSchema, "params"),
  authController.verifyEmail,
);

authRoutes.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  authController.login,
);

authRoutes.post(
  "/refresh-token",
  sessionCheckLimiter,
  authController.refreshToken,
);

authRoutes.post(
  "/forgot-password",
  authLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword,
);

authRoutes.post(
  "/reset-password",
  authLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword,
);

authRoutes.post(
  "/resend-verification",
  authLimiter,
  validate(resendVerificationSchema),
  authController.resendVerification,
);

// --- OAuth Routes ---

// Google OAuth
authRoutes.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
);

authRoutes.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${env.FRONTEND_URL}/login?error=google_auth_failed`,
  }),
  authController.oauthCallback,
);

// GitHub OAuth
authRoutes.get(
  "/github",
  passport.authenticate("github", {
    scope: ["user:email"],
    session: false,
  }),
);

authRoutes.get(
  "/github/callback",
  passport.authenticate("github", {
    session: false,
    failureRedirect: `${env.FRONTEND_URL}/login?error=github_auth_failed`,
  }),
  authController.oauthCallback,
);

// --- Protected User Routes ---

authRoutes.get("/me", sessionCheckLimiter, authMiddleware, getCurrentUser);

authRoutes.patch(
  "/me",
  sessionCheckLimiter,
  authMiddleware,
  validate(updateProfileSchema),
  updateProfileController,
);

// H3 Fix: Unprotected route so users with expired access tokens can log out cleanly
authRoutes.post("/logout", authController.logout);

authRoutes.post(
  "/change-password",
  authLimiter,
  authMiddleware,
  validate(changePasswordSchema),
  authController.changePassword,
);

authRoutes.delete(
  "/me",
  authMiddleware,
  validate(deleteAccountSchema),
  authController.deleteAccount,
);

export default authRoutes;
