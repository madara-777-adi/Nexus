"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = __importDefault(require("./config/env"));
const database_1 = __importDefault(require("./config/database"));
const startServer = async () => {
    try {
        await (0, database_1.default)();
        app_1.default.listen(env_1.default.PORT, () => {
            console.log(`Server running on port ${env_1.default.PORT}`);
        });
    }
    catch (error) {
        console.error("Failed to start server");
        console.error(error);
        process.exit(1);
    }
};
startServer();
