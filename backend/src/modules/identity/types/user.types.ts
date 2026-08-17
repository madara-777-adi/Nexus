export type UserRole = "USER" | "ADMIN";

export type AccountStatus = "PENDING_VERIFICATION" | "ACTIVE" | "SUSPENDED";

export type AuthProvider = "LOCAL" | "GOOGLE" | "GITHUB";

export interface IUser {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  password?: string; // Optional for OAuth users
  passwordHistory?: string[];
  provider: AuthProvider;
  googleId?: string | null;
  githubId?: string | null;
  avatar?: string | null;
  role: UserRole;
  bio?: string;
  isEmailVerified: boolean;
  accountStatus: AccountStatus;
  tokenVersion?: number;
  termsAcceptedAt?: Date | null;
  privacyPolicyAcceptedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
