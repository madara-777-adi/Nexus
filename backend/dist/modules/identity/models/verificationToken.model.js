"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const verificationTokenSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    tokenHash: {
        type: String,
        required: true,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
}, {
    timestamps: true,
});
verificationTokenSchema.index({
    expiresAt: 1,
}, {
    expireAfterSeconds: 0,
});
const VerificationToken = (0, mongoose_1.model)("VerificationToken", verificationTokenSchema);
exports.default = VerificationToken;
