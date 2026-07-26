import { Request, Response } from "express";

import authService from "../services/auth.service";
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

    const { message, ...data } = result;

    return res.status(200).json({
      success: true,
      message,
      data,
    });
  }

  async refreshToken(req: Request<{}, {}, RefreshTokenDTO>, res: Response) {
    const result = await authService.refreshToken(req.body);

    const { message, ...data } = result;

    return res.status(200).json({
      success: true,
      message,
      data,
    });
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

  async logout(req: Request<{}, {}, LogoutDTO>, res: Response) {
    const result = await authService.logout(req.body);

    const { message, ...data } = result;

    return res.status(200).json({
      success: true,
      message,
      data,
    });
  }
}

export default new AuthController();
