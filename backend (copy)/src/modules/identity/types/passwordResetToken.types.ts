import { Types } from "mongoose";

export interface IPasswordResetToken{
    user:Types.ObjectId;
    tokenHash:string;
    expiresAt:Date;
    createdAt?:Date;
    updatedAt?:Date;
}