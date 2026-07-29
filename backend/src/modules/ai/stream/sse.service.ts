import { Response, Request } from "express";

export class SSEService {
  static initStream(res: Response) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Prevents proxy buffering on Render/Nginx
    res.flushHeaders();
  }

  static sendChunk(res: Response, chunk: string) {
    // Only write if the client connection is still open and active
    if (!res.writableEnded && !res.closed) {
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    }
  }

  static endStream(res: Response) {
    if (!res.writableEnded && !res.closed) {
      res.write("data: [DONE]\n\n");
      res.end();
    }
  }

  static handleDisconnect(req: Request, res: Response, onDisconnect?: () => void) {
    req.on("close", () => {
      if (onDisconnect) onDisconnect();
      if (!res.writableEnded) res.end();
    });
  }
}