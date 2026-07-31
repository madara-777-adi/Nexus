import { Request, Response } from "express";

import authService from "../services/auth.service";
import env from "../../../config/env";
import type {
  ForgotPasswordDTO,
  LoginDTO,
  LogoutDTO,
  RefreshTokenDTO,
  RegisterDTO,
  ResendVerificationDTO,
  ResetPasswordDTO,
  VerifyEmailParamsDTO,
} from "../types/identity.dto.js";

const isProduction = process.env.NODE_ENV === "production";
const REFRESH_COOKIE_NAME = isProduction
  ? "__Host-refreshToken"
  : "refreshToken";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? ("none" as const) : ("lax" as const),
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const clearCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? ("none" as const) : ("lax" as const),
  path: "/",
};

class AuthController {
  async register(req: Request<{}, {}, RegisterDTO>, res: Response) {
    const result = await authService.register(req.body);

    return res.status(201).json({
      success: true,
      message: result.message,
      data: null,
    });
  }

  async verifyEmail(req: Request<VerifyEmailParamsDTO>, res: Response) {
    const token = req.params.token;

    const result = await authService.verifyEmail(token);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: null,
    });
  }

  async login(req: Request<{}, {}, LoginDTO>, res: Response) {
    const result = await authService.login(req.body);

    const { message, refreshToken, ...data } = result;

    if (refreshToken) {
      res.cookie(REFRESH_COOKIE_NAME, refreshToken, cookieOptions);
    }

    return res.status(200).json({
      success: true,
      message,
      data,
    });
  }

  async refreshToken(
    req: Request<{}, {}, Partial<RefreshTokenDTO>>,
    res: Response,
  ) {
    const token =
      req.cookies?.[REFRESH_COOKIE_NAME] ||
      req.cookies?.refreshToken ||
      req.body?.refreshToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No refresh token provided",
        data: null,
      });
    }

    try {
      const result = await authService.refreshToken({ refreshToken: token });

      const { message, refreshToken: newRefreshToken, ...data } = result;

      if (newRefreshToken) {
        res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, cookieOptions);
      }

      return res.status(200).json({
        success: true,
        message,
        data,
      });
    } catch (_error) {
      res.clearCookie(REFRESH_COOKIE_NAME, clearCookieOptions);

      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
        data: null,
      });
    }
  }

  async forgotPassword(req: Request<{}, {}, ForgotPasswordDTO>, res: Response) {
    const result = await authService.forgotPassword(req.body);

    return res.status(200).json({
      success: true,
      message: result?.message,
      data: null,
    });
  }

  async resetPassword(req: Request<{}, {}, ResetPasswordDTO>, res: Response) {
    const result = await authService.resetPassword(req.body);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: null,
    });
  }

  async resendVerification(
    req: Request<{}, {}, ResendVerificationDTO>,
    res: Response,
  ) {
    const result = await authService.resendVerification(req.body);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: null,
    });
  }

  async oauthCallback(req: Request, res: Response) {
    try {
      const user = req.user as any;

      if (!user) {
        return res.redirect(`${env.FRONTEND_URL}/login?error=auth_failed`);
      }

      const result = await authService.handleOAuthSuccess(user);

      if (result.refreshToken) {
        res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, cookieOptions);
      }

      return res.redirect(`${env.FRONTEND_URL}/dashboard`);
    } catch (_error) {
      return res.redirect(
        `${env.FRONTEND_URL}/login?error=oauth_processing_failed`,
      );
    }
  }

  async logout(req: Request<{}, {}, Partial<LogoutDTO>>, res: Response) {
    const token =
      req.cookies?.[REFRESH_COOKIE_NAME] ||
      req.cookies?.refreshToken ||
      req.body?.refreshToken;

    if (token) {
      try {
        await authService.logout({ refreshToken: token });
      } catch (_err) {
        // Ignore service logout failure, continue to clear cookie
      }
    }

    res.clearCookie(REFRESH_COOKIE_NAME, clearCookieOptions);

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
      data: null,
    });
  }
}

export default new AuthController();
