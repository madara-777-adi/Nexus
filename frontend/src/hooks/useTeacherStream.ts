import { useState, useCallback, useRef } from "react";
import api, { getAccessToken } from "../api/axios";

interface StreamOptions {
  conceptId: string;
  workspaceId: string;
  prompt?: string;
}

export function useTeacherStream() {
  const [content, setContent] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Abort controller ref to cancel ongoing streams when switching concepts
  const abortControllerRef = useRef<AbortController | null>(null);

  const startStream = useCallback(async ({ conceptId, workspaceId, prompt }: StreamOptions) => {
    // 1. Cancel any active stream before starting a new one
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsStreaming(true);
    setContent("");
    setError(null);

    try {
      const token = getAccessToken();
      const baseUrl = api.defaults.baseURL;

      const response = await fetch(`${baseUrl}/ai/teacher/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        signal: controller.signal,
        body: JSON.stringify({ conceptId, workspaceId, prompt }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Session expired. Please log in again.");
        }
        if (response.status === 429) {
          throw new Error("Quota limit reached. Please wait a few minutes before streaming another lesson.");
        }
        throw new Error(`Failed to initialize stream (HTTP ${response.status})`);
      }

      if (!response.body) {
        throw new Error("ReadableStream not supported by browser or empty body.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        // Append new network chunk to our carry-over buffer
        buffer += decoder.decode(value, { stream: true });
        
        // Split by SSE message boundary (\n\n)
        const parts = buffer.split("\n\n");
        
        // Retain the last un-delimited part in the buffer for the next iteration
        buffer = parts.pop() || "";

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data:")) continue;

          const jsonStr = line.replace(/^data:\s*/, "");
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const chunkText = parsed.text || parsed.content || parsed.delta || "";
            setContent((prev) => prev + chunkText);
          } catch {
            // Buffer safety: Ignore incomplete JSON lines that will settle on next chunk
          }
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        // Stream intentionally cancelled due to node switch
        return;
      }
      console.error("Teacher stream error:", err);
      setError(err.message || "An error occurred while streaming the lesson.");
    } finally {
      if (abortControllerRef.current === controller) {
        setIsStreaming(false);
      }
    }
  }, []);

  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  return { content, isStreaming, error, startStream, stopStream };
}