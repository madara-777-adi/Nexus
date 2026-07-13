"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    PORT: zod_1.z.coerce.number().default(5000),
    NODE_ENV: zod_1.z
        .enum(["development", "production", "test"])
        .default("development"),
    MONGO_URI: zod_1.z.string().min(32, "JWT_SECRET must be 32 charecters long"),
    //   RESEND_API_KEY: z.string().min(1),
    //   EMAIL_FROM: z.email(),
});
const env = envSchema.parse(process.env);
exports.default = env;
