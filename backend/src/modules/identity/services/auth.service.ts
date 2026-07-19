import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt, { JwtPayload } from "jsonwebtoken";
import { z } from "zod";

import env from "../../../config/env";

// Models
import RefreshToken from "../models/refreshToken.model";
import User from "../models/user.model";
import VerificationToken from "../models/verificationToken.model";

// Validators
import {
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  resendVerificationSchema,
} from "../validators/auth.validator";
import { loginSchema } from "../validators/login.validator";
import { refreshTokenRequestSchema } from "../validators/refresh-token.validator";
import { logoutSchema } from "../validators/logout.validator";

// Services
import emailService from "./email.service";

// Utils
import generateTokens from "../../../shared/utils/generateTokens";
import generateUserId from "../../../shared/utils/generateUserId";
import generateVerificationToken from "../../../shared/utils/generateVerificationToken";
import PasswordResetToken from "../models/passwordResetToken.model";

type RegisterInput = z.infer<typeof registerSchema>;
type LoginInput = z.infer<typeof loginSchema>;
type RefreshTokenInput = z.infer<typeof refreshTokenRequestSchema>;
type LogoutInput = z.infer<typeof logoutSchema>;
type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;

class AuthService {
  async register(data: RegisterInput) {
    const existingUser = await User.findOne({
      email: data.email,
    });

    if (existingUser) {
      throw new Error("This email is already registered with another account.");
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
      email: data.email,
      password: hashedPassword,
    });

    const { token, tokenHash } = generateVerificationToken();

    await VerificationToken.create({
      user: user._id,
      tokenHash,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    });

    await emailService.sendVerificationEmail(user.email, user.firstName, token);

    return {
      message:
        "Registration successful. Please check your inbox to verify your account.",
    };
  }

  async verifyEmail(token: string) {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const verificationRecord = await VerificationToken.findOne({
      tokenHash,
    });

    if (!verificationRecord) {
      throw new Error("Invalid or expired verification link.");
    }

    if (verificationRecord.expiresAt < new Date()) {
      throw new Error("Expired verification link.");
    }

    const user = await User.findById(verificationRecord.user);

    if (!user) {
      throw new Error("User not found.");
    }

    if (user.isEmailVerified) {
      throw new Error("Email already verified.");
    }

    user.isEmailVerified = true;

    await user.save();

    await VerificationToken.deleteOne({
      _id: verificationRecord._id,
    });

    return {
      message: "Email verified successfully.",
    };
  }

  async login(data: LoginInput) {
    const user = await User.findOne({
      email: data.email,
    }).select("+password");

    if (!user) {
      throw new Error("Invalid email or password.");
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw new Error("Invalid email or password.");
    }

    if (!user.isEmailVerified) {
      throw new Error("Please verify your email before logging in.");
    }

    const tokens = generateTokens({
      sub: user.userId,
    });

    const refreshTokenHash = crypto
      .createHash("sha256")
      .update(tokens.refreshToken)
      .digest("hex");

    // Allow only one active refresh token per user
    await RefreshToken.deleteMany({
      user: user._id,
    });

    await RefreshToken.create({
      user: user._id,
      tokenHash: refreshTokenHash,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    });

    return {
      message: "Login successful.",
      ...tokens,
    };
  }

  async forgotPassword(data: ForgotPasswordInput) {
    const user = await User.findOne({
      email: data.email,
    });
    if (!user) {
      return {
        message:
          "if an account with this email exists, password reset instructions have been sent.",
      };
    }
    if (!user.isEmailVerified) {
      throw new Error(
        "Please verify your email before resetting your password",
      );
    }

    const { token, tokenHash } = generateVerificationToken();
    const existingResetToken = await PasswordResetToken.findOneAndUpdate(
      {
        user: user._id,
      },
      {
        tokenHash,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
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
        "if an account with this email exists, password reset instructions have been sent.",
    };
  }

  async refreshToken(data: RefreshTokenInput) {
    const decoded = jwt.verify(
      data.refreshToken,
      env.JWT_REFRESH_SECRET,
    ) as JwtPayload;

    if (!decoded.sub) {
      throw new Error("Invalid refresh token.");
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(data.refreshToken)
      .digest("hex");

    const storedRefreshToken = await RefreshToken.findOne({
      tokenHash,
    });

    if (!storedRefreshToken) {
      throw new Error("Invalid refresh token.");
    }

    if (storedRefreshToken.expiresAt < new Date()) {
      throw new Error("Refresh token expired.");
    }

    const user = await User.findById(storedRefreshToken.user);

    if (!user) {
      throw new Error("User not found.");
    }

    if (decoded.sub !== user.userId) {
      throw new Error("Invalid refresh token.");
    }

    const tokens = generateTokens({
      sub: user.userId,
    });

    await RefreshToken.deleteOne({
      _id: storedRefreshToken._id,
    });

    const newRefreshTokenHash = crypto
      .createHash("sha256")
      .update(tokens.refreshToken)
      .digest("hex");

    await RefreshToken.create({
      user: user._id,
      tokenHash: newRefreshTokenHash,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    });

    return {
      message: "Token refreshed successfully.",
      ...tokens,
    };
  }

  async resetPassword(data: ResetPasswordInput) {
    const tokenHash = crypto
      .createHash("sha256")
      .update(data.token)
      .digest("hex");
    const passwordResetToken = await PasswordResetToken.findOne({
      tokenHash,
    });
    if (!passwordResetToken) {
      throw new Error("Invalid or expired password reset link.");
    }
    if (passwordResetToken.expiresAt < new Date()) {
      throw new Error("Password reset link has expired.");
    }
    const user = await User.findById(passwordResetToken.user).select(
      "+password +passwordHistory",
    );
    if (!user) {
      throw new Error("User not found.");
    }
    const isCurrentPassword = await bcrypt.compare(
      data.password,
      user.password,
    );

    if (isCurrentPassword) {
      throw new Error(
        "Your new password must be different from your current password.",
      );
    }
    for (const oldPasswordHash of user.passwordHistory) {
      const isReusedPassword = await bcrypt.compare(
        data.password,
        oldPasswordHash,
      );

      if (isReusedPassword) {
        throw new Error("You cannot reuse any of your last five passwords.");
      }
    }
    const hashedPassword = await bcrypt.hash(data.password, 12);
    user.passwordHistory.push(user.password);
    if (user.passwordHistory.length > 5) {
      user.passwordHistory.shift();
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

  async resendVerification(data: ResendVerificationInput) {
    // Find the user
    const user = await User.findOne({
      email: data.email.toLowerCase(),
    });

    // Unknown email
    if (!user) {
      return {
        message:
          "If an account with that email exists, a verification email will be sent.",
      };
    }

    // Already verified
    if (user.isEmailVerified) {
      return {
        message: "Your email address is already verified.",
      };
    }

    // Find existing verification token
    const verificationToken = await VerificationToken.findOne({
      user: user._id,
    });

    // Cooldown check
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

    // Generate a new verification token
    const { token, tokenHash } = generateVerificationToken();

    // Calculate expiry
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Update existing document or create a new one
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

    // Send verification email
    await emailService.sendVerificationEmail(user.email, user.firstName, token);

    return {
      message: "A verification email has been sent successfully.",
    };
  }

  async logout(data: LogoutInput) {
    const tokenHash = crypto
      .createHash("sha256")
      .update(data.refreshToken)
      .digest("hex");

    const deletedToken = await RefreshToken.deleteOne({
      tokenHash,
    });

    if (deletedToken.deletedCount === 0) {
      throw new Error("Invalid refresh token.");
    }

    return {
      message: "Logged out successfully.",
    };
  }
}

export default new AuthService();
