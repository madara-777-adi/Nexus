"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 50,
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 50,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, "Invalid email address."],
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
        select: false,
    },
    passwordHistory: {
        type: [String],
        default: [],
        select: false,
    },
    avatar: {
        type: String,
        default: null,
    },
    role: {
        type: String,
        enum: ["USER", "ADMIN"],
        default: "USER",
    },
    isEmailVerified: {
        type: Boolean,
        default: false,
    },
    accountStatus: {
        type: String,
        enum: ["PENDING_VERIFICATION", "ACTIVE", "SUSPENDED"],
        default: "PENDING_VERIFICATION",
    },
}, {
    timestamps: true,
});
const User = (0, mongoose_1.model)("User", userSchema);
exports.default = User;
