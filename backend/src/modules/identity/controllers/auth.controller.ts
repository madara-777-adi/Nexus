import { Request, Response } from "express";

import authService from "../services/auth.service";

class AuthController {
  async register(req: Request, res: Response) {
    const result = await authService.register(req.body);

    return res.status(201).json({
      success: true,
      message: result.message,
      data: null,
    });
  }

  async verifyEmail(req: Request, res: Response) {
    const token = req.params.token as string;

    const result = await authService.verifyEmail(token);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: null,
    });
  }

  async login(req: Request, res: Response) {
    const result = await authService.login(req.body);

    const { message, ...data } = result;

    return res.status(200).json({
      success: true,
      message,
      data,
    });
  }

  async refreshToken(req: Request, res: Response) {
    const result = await authService.refreshToken(req.body);

    const { message, ...data } = result;

    return res.status(200).json({
      success: true,
      message,
      data,
    });
  }

  async forgotPassword(req: Request, res: Response) {
    const result = await authService.forgotPassword(req.body);

    return res.status(200).json({
      success: true,
      message: result?.message,
      data: null,
    });
  }

  async resetPassword(req: Request, res: Response) {
    const result = await authService.resetPassword(req.body);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: null,
    });
  }

  async resendVerification(req: Request, res: Response): Promise<void> {
    const result = await authService.resendVerification(req.body);

    res.status(200).json(result);
  }

  async logout(req: Request, res: Response) {
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
