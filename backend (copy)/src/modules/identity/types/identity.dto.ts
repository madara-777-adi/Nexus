export type RegisterDTO = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

export type ForgotPasswordDTO = {
  email: string;
};

export type ResetPasswordDTO = {
  token: string;
  password: string;
};

export type ResendVerificationDTO = {
  email: string;
};

export type LoginDTO = {
  email: string;
  password: string;
};

export type RefreshTokenDTO = {
  refreshToken: string;
};

export type LogoutDTO = {
  refreshToken: string;
};

export type UpdateProfileDTO = {
  firstName?: string;
  lastName?: string;
  bio?: string;
};

export type VerifyEmailParamsDTO = {
  token: string;
};