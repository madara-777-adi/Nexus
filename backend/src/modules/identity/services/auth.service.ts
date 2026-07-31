import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt, { JwtPayload } from "jsonwebtoken";

import env from "../../../config/env";

// Models
import RefreshToken from "../models/refreshToken.model";
import User from "../models/user.model";
import VerificationToken from "../models/verificationToken.model";
import PasswordResetToken from "../models/passwordResetToken.model";

// Errors
import { ConflictError } from "../../../shared/errors/ConflictError";
import { BadRequestError } from "../../../shared/errors/BadRequestError";
import { ForbiddenError } from "../../../shared/errors/ForbiddenError";
import { NotFoundError } from "../../../shared/errors/NotFoundError";
import { UnauthorizedError } from "../../../shared/errors/UnauthorizedError";

// Services
import emailService from "./email.service";

// Utils
import generateTokens from "../../../shared/utils/generateTokens";
import generateUserId from "../../../shared/utils/generateUserId";
import generateVerificationToken from "../../../shared/utils/generateVerificationToken";

// Types
import type {
  ForgotPasswordDTO,
  LoginDTO,
  LogoutDTO,
  RefreshTokenDTO,
  RegisterDTO,
  ResendVerificationDTO,
  ResetPasswordDTO,
} from "../types/identity.dto.js";

/**
 * Calculates expiry Date based on env.JWT_REFRESH_EXPIRES_IN (e.g., "7d", "30d", "24h")
 */
export function getRefreshTokenExpiryMs(): number {
  const expiresIn = env.JWT_REFRESH_EXPIRES_IN || "7d";
  const defaultMs = 7 * 24 * 60 * 60 * 1000; // 7 days default fallback

  if (typeof expiresIn === "number") {
    return expiresIn * 1000;
  }

  const match = /^(\d+)([dhms])?$/i.exec(expiresIn.trim());
  if (!match) return defaultMs;

  const value = parseInt(match[1], 10);
  const unit = (match[2] || "s").toLowerCase();

  switch (unit) {
    case "d":
      return value * 24 * 60 * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "m":
      return value * 60 * 1000;
    case "s":
      return value * 1000;
    default:
      return defaultMs;
  }
}

export function getRefreshTokenExpiryDate(): Date {
  return new Date(Date.now() + getRefreshTokenExpiryMs());
}

class AuthService {
  async register(data: RegisterDTO) {
    const existingUser = await User.findOne({
      email: data.email.toLowerCase().trim(),
    });

    if (existingUser) {
      throw new ConflictError(
        "This email is already registered with another account.",
      );
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    let userId: string;

    do {
      userId = generateUserId();
    } while (await User.exists({ userId }));

    const user = await User.create({
      userId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email.toLowerCase().trim(),
      password: hashedPassword,
    });

    const { token, tokenHash } = generateVerificationToken();

    const verificationRecord = await VerificationToken.create({
      user: user._id,
      tokenHash,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    });

    // H5 Fix: Rollback user and token creation if verification email dispatch fails
    try {
      await emailService.sendVerificationEmail(
        user.email,
        user.firstName,
        token,
      );
    } catch (emailError) {
      console.error(
        "[AuthService] Registration verification email dispatch failed. Rolling back user creation:",
        emailError,
      );
      await VerificationToken.deleteOne({ _id: verificationRecord._id });
      await User.deleteOne({ _id: user._id });
      throw new Error(
        "Failed to send verification email. Please try again later.",
      );
    }

    return {
      message:
        "Registration successful. Please check your inbox to verify your account.",
    };
  }

  async verifyEmail(token: string) {
    if (!token) {
      throw new BadRequestError("Verification token is required.");
    }

    const cleanToken = token.trim();
    const tokenHash = crypto
      .createHash("sha256")
      .update(cleanToken)
      .digest("hex");

    const verificationRecord = await VerificationToken.findOne({
      tokenHash,
    });

    if (!verificationRecord) {
      throw new BadRequestError("Invalid or expired verification link.");
    }

    if (verificationRecord.expiresAt < new Date()) {
      throw new BadRequestError("Expired verification link.");
    }

    const user = await User.findById(verificationRecord.user);

    if (!user) {
      throw new NotFoundError("User not found.");
    }

    if (user.isEmailVerified) {
      throw new ConflictError("Email already verified.");
    }

    user.isEmailVerified = true;
    user.accountStatus = "ACTIVE";

    await user.save();

    await VerificationToken.deleteOne({
      _id: verificationRecord._id,
    });

    // Audit 4.7 Fix: Send welcome email after successful email verification
    try {
      await emailService.sendWelcomeEmail(user.email, user.firstName);
    } catch (emailErr) {
      console.error("[AuthService] Failed to send welcome email:", emailErr);
    }

    return {
      message: "Email verified successfully.",
    };
  }

  async login(data: LoginDTO) {
    const normalizedEmail = data.email.toLowerCase().trim();
    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password");

    if (!user) {
      throw new UnauthorizedError("Invalid email or password.");
    }

    if (!user.password) {
      throw new UnauthorizedError(
        `This account was created using ${user.provider}. Please sign in using ${user.provider}.`,
      );
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid email or password.");
    }

    if (user.accountStatus === "SUSPENDED") {
      throw new ForbiddenError(
        "Your account has been suspended. Please contact support.",
      );
    }

    if (!user.isEmailVerified) {
      throw new ForbiddenError("Please verify your email before logging in.");
    }

    const tokens = generateTokens({
      sub: user.userId,
    });

    const refreshTokenHash = crypto
      .createHash("sha256")
      .update(tokens.refreshToken)
      .digest("hex");

    await RefreshToken.deleteMany({
      user: user._id,
    });

    await RefreshToken.create({
      user: user._id,
      tokenHash: refreshTokenHash,
      expiresAt: getRefreshTokenExpiryDate(),
    });

    return {
      message: "Login successful.",
      ...tokens,
    };
  }

  async handleOAuthSuccess(user: any) {
    if (user.accountStatus === "SUSPENDED") {
      throw new ForbiddenError(
        "Your account has been suspended. Please contact support.",
      );
    }

    const tokens = generateTokens({
      sub: user.userId,
    });

    const refreshTokenHash = crypto
      .createHash("sha256")
      .update(tokens.refreshToken)
      .digest("hex");

    await RefreshToken.deleteMany({
      user: user._id,
    });

    await RefreshToken.create({
      user: user._id,
      tokenHash: refreshTokenHash,
      expiresAt: getRefreshTokenExpiryDate(),
    });

    return {
      message: "OAuth authentication successful.",
      ...tokens,
    };
  }

  async forgotPassword(data: ForgotPasswordDTO) {
    const normalizedEmail = data.email.toLowerCase().trim();
    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return {
        message:
          "If an account with this email exists, password reset instructions have been sent.",
      };
    }

    if (user.accountStatus === "SUSPENDED") {
      throw new ForbiddenError(
        "Your account has been suspended. Please contact support.",
      );
    }

    if (!user.isEmailVerified) {
      throw new ForbiddenError(
        "Please verify your email before resetting your password.",
      );
    }

    const { token, tokenHash } = generateVerificationToken();
    await PasswordResetToken.findOneAndUpdate(
      {
        user: user._id,
      },
      {
        tokenHash,
        expiresAt: new Date(Date.now() + 1000 * 60 * 30),
      },
      {
        upsert: true,
        returnDocument: "after",
      },
    );
    await emailService.sendPasswordResetEmail(
      user.email,
      user.firstName,
      token,
    );
    return {
      message:
        "If an account with this email exists, password reset instructions have been sent.",
    };
  }

  async refreshToken(data: RefreshTokenDTO) {
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(
        data.refreshToken,
        env.JWT_REFRESH_SECRET,
      ) as JwtPayload;
    } catch (_error) {
      throw new UnauthorizedError("Invalid or expired refresh token.");
    }

    if (!decoded.sub) {
      throw new UnauthorizedError("Invalid refresh token.");
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(data.refreshToken)
      .digest("hex");

    const storedRefreshToken = await RefreshToken.findOne({ tokenHash });

    if (!storedRefreshToken) {
      throw new UnauthorizedError("Invalid refresh token.");
    }

    if (storedRefreshToken.expiresAt < new Date()) {
      throw new UnauthorizedError("Refresh token expired.");
    }

    const user = await User.findById(storedRefreshToken.user);

    if (!user) {
      throw new NotFoundError("User not found.");
    }

    if (user.accountStatus === "SUSPENDED") {
      throw new ForbiddenError(
        "Your account has been suspended. Please contact support.",
      );
    }

    if (decoded.sub !== user.userId) {
      throw new UnauthorizedError("Invalid refresh token.");
    }

    const tokens = generateTokens({ sub: user.userId });

    await RefreshToken.deleteOne({ _id: storedRefreshToken._id });

    const newRefreshTokenHash = crypto
      .createHash("sha256")
      .update(tokens.refreshToken)
      .digest("hex");

    await RefreshToken.create({
      user: user._id,
      tokenHash: newRefreshTokenHash,
      expiresAt: getRefreshTokenExpiryDate(),
    });

    return {
      message: "Token refreshed successfully.",
      ...tokens,
    };
  }

  async resetPassword(data: ResetPasswordDTO) {
    const tokenHash = crypto
      .createHash("sha256")
      .update(data.token)
      .digest("hex");
    const passwordResetToken = await PasswordResetToken.findOne({
      tokenHash,
    });
    if (!passwordResetToken) {
      throw new BadRequestError("Invalid or expired password reset link.");
    }
    if (passwordResetToken.expiresAt < new Date()) {
      throw new BadRequestError("Password reset link has expired.");
    }
    const user = await User.findById(passwordResetToken.user).select(
      "+password +passwordHistory",
    );
    if (!user) {
      throw new NotFoundError("User not found.");
    }

    if (user.accountStatus === "SUSPENDED") {
      throw new ForbiddenError(
        "Your account has been suspended. Please contact support.",
      );
    }

    if (user.password) {
      const isCurrentPassword = await bcrypt.compare(
        data.password,
        user.password,
      );

      if (isCurrentPassword) {
        throw new ConflictError(
          "Your new password must be different from your current password.",
        );
      }
      for (const oldPasswordHash of user.passwordHistory || []) {
        const isReusedPassword = await bcrypt.compare(
          data.password,
          oldPasswordHash,
        );

        if (isReusedPassword) {
          throw new ConflictError(
            "You cannot reuse any of your last five passwords.",
          );
        }
      }
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);
    if (user.password) {
      if (!user.passwordHistory) user.passwordHistory = [];
      user.passwordHistory.push(user.password);
      if (user.passwordHistory.length > 5) {
        user.passwordHistory.shift();
      }
    }
    user.password = hashedPassword;
    await user.save();

    await PasswordResetToken.deleteOne({
      _id: passwordResetToken._id,
    });
    await RefreshToken.deleteMany({
      user: user._id,
    });

    return {
      message: "Password has been reset successfully.",
    };
  }

  async resendVerification(data: ResendVerificationDTO) {
    const user = await User.findOne({
      email: data.email.toLowerCase().trim(),
    });

    if (!user) {
      return {
        message:
          "If an account with that email exists, a verification email will be sent.",
      };
    }

    if (user.accountStatus === "SUSPENDED") {
      throw new ForbiddenError(
        "Your account has been suspended. Please contact support.",
      );
    }

    if (user.isEmailVerified) {
      return {
        message: "Your email address is already verified.",
      };
    }

    const verificationToken = await VerificationToken.findOne({
      user: user._id,
    });

    if (verificationToken) {
      const nextAllowedResend = new Date(
        verificationToken.updatedAt.getTime() + 15 * 60 * 1000,
      );

      if (new Date() < nextAllowedResend) {
        return {
          message: "Please wait before requesting another verification email.",
        };
      }
    }

    const { token, tokenHash } = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await VerificationToken.findOneAndUpdate(
      {
        user: user._id,
      },
      {
        tokenHash,
        expiresAt,
      },
      {
        upsert: true,
        returnDocument: "after",
      },
    );

    await emailService.sendVerificationEmail(user.email, user.firstName, token);

    return {
      message: "A verification email has been sent successfully.",
    };
  }

  async logout(data: LogoutDTO) {
    const tokenHash = crypto
      .createHash("sha256")
      .update(data.refreshToken)
      .digest("hex");

    const deletedToken = await RefreshToken.deleteOne({
      tokenHash,
    });

    if (deletedToken.deletedCount === 0) {
      throw new UnauthorizedError("Invalid refresh token.");
    }

    return {
      message: "Logged out successfully.",
    };
  }
}

export default new AuthService();
