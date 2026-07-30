import { useState, useCallback, useRef } from "react";
import { generateLesson } from "../api/ai.api";
import type { QuizQuestion } from "../types/ai.types";

export interface ParsedLesson {
  overview?: string;
  definition?: string;
  intuition?: string;
  analogy?: string;
  explanation?: string;
  keyPoints?: string[];
  quiz?: QuizQuestion[];
}

interface StreamOptions {
  workspaceId: string;
  workspaceTitle: string;
  conceptId: string;
  conceptTitle: string;
  difficulty?: string;
  preferredDepth?: string;
}

export function useTeacherStream() {
  const [parsedLesson, setParsedLesson] = useState<ParsedLesson | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  }, []);

  const streamLesson = useCallback(
    async (params: StreamOptions) => {
      // Abort any ongoing request before starting a new one
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoading(true);
      setParsedLesson(null);
      setError(null);

      try {
        const lessonData = await generateLesson({
          workspaceId: params.workspaceId,
          workspaceTitle: params.workspaceTitle,
          conceptId: params.conceptId,
          conceptTitle: params.conceptTitle,
          difficulty: params.difficulty,
          preferredDepth: params.preferredDepth,
        });

        // If this request was aborted while waiting, do not update state
        if (controller.signal.aborted) return;

        setParsedLesson(lessonData as ParsedLesson);
      } catch (err: unknown) {
        if (controller.signal.aborted) return;

        console.error("Teacher lesson generation error:", err);
        const errorMessage =
          (err as any)?.response?.data?.message ||
          (err instanceof Error
            ? err.message
            : "An error occurred while generating the lesson.");
        setError(errorMessage);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [], // Empty dependency array ensures streamLesson reference remains completely stable
  );

  return { parsedLesson, isLoading, error, streamLesson, stopStream };
}
