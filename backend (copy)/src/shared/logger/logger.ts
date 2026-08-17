import pino from "pino";
import env from "../../config/env";

const logger = pino({
    level: env.NODE_ENV === "production"? "info":"debug",

    transport:
    env.NODE_ENV !== "production"
    ?{
        target:"pino-pretty",
        options:{
            colorize:true,
            translateTime:"SYS:standard",
            ignore:"pid,hostname",
        },
    } : undefined,
});

export default logger;