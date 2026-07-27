import crypto from "crypto";

export default function generateVerificationToken() {
  // 1. Generate 32 random bytes as hex (64 characters)
  const token = crypto.randomBytes(32).toString("hex");

  // 2. Hash that exact token using SHA-256 for database storage
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  return { token, tokenHash };
}