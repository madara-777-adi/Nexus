import jwt, { SignOptions } from "jsonwebtoken";

import env from "../../config/env";

type TokenPayload = {
  sub: string;
};

const generateTokens = (payload: TokenPayload) => {
  const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as SignOptions);

  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as SignOptions);

  return {
    accessToken,
    refreshToken,
  };
};

export default generateTokens;
