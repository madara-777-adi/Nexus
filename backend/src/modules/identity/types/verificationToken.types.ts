import { Types } from "mongoose";

export interface IVerificationToken{
    user: Types.ObjectId;
    tokenHash : string;
    expiresAt:Date;
    createdAt?:Date;
    updatedAt?:Date;
}