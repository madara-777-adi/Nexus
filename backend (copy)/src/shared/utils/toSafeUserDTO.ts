import { IUser } from "../../modules/identity/types/user.types";

export type SafeUserDTO = Omit<
  IUser,
  "password" | "passwordHistory" | "googleId" | "githubId"
>;

export function toSafeUserDTO(user: any): SafeUserDTO {
  const raw =
    user && typeof user.toObject === "function" ? user.toObject() : user || {};

  return {
    userId: raw.userId,
    firstName: raw.firstName,
    lastName: raw.lastName,
    email: raw.email,
    provider: raw.provider,
    avatar: raw.avatar,
    role: raw.role,
    bio: raw.bio,
    isEmailVerified: raw.isEmailVerified,
    accountStatus: raw.accountStatus,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}