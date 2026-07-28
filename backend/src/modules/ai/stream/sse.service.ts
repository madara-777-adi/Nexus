import { Response } from "express";

export class SSEService {
  static initStream(res: Response) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Prevents proxy buffering on Render/Nginx
    res.flushHeaders();
  }

  static sendChunk(res: Response, chunk: string) {
    res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
  }

  static endStream(res: Response) {
    res.write("data: [DONE]\n\n");
    res.end();
  }
}