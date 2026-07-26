export type UserRole = "USER" | "ADMIN";

export type AccountStatus = "PENDING_VERIFICATION" | "ACTIVE" | "SUSPENDED";

export interface IUser {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  passwordHistory: string[];
  avatar?: string | null;
  role: UserRole;
  bio?: string;
  isEmailVerified: boolean;
  accountStatus: AccountStatus;
  createdAt: Date;
  updatedAt: Date;
}
