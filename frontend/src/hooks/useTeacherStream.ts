import { useState, useCallback } from "react";
import { type TeacherContext } from "../types/ai.types";
import { type TeacherLesson } from "../types/ai.types";

export function useTeacherStream() {
  const [lessonText, setLessonText] = useState<string>("");
  const [parsedLesson, setParsedLesson] = useState<Partial<TeacherLesson> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const streamLesson = useCallback(async (context: TeacherContext) => {
    setIsLoading(true);
    setError(null);
    setLessonText("");
    setParsedLesson(null);

    const baseUrl = import.meta.env.VITE_API_URL || "https://api.nexusspace.tech";

    try {
      const response = await fetch(`${baseUrl}/api/v1/ai/teacher/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(context),
      });

      if (!response.ok) {
        throw new Error(`Stream failed with status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No readable stream received.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let accumulatedText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.replace("data: ", "").trim();

            if (dataStr === "[DONE]") {
              break;
            }

            try {
              const { chunk: contentChunk } = JSON.parse(dataStr);
              if (contentChunk) {
                accumulatedText += contentChunk;
                setLessonText(accumulatedText);

                try {
                  const partialJson = JSON.parse(accumulatedText);
                  setParsedLesson(partialJson);
                } catch {
                  // Buffer is mid-chunk JSON, continue stream accumulation
                }
              }
            } catch {
              // Ignore line parse noise
            }
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to stream lesson from teacher.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { streamLesson, lessonText, parsedLesson, isLoading, error };
}