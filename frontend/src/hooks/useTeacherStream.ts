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
  
  const activeRequestRef = useRef<symbol | null>(null);

  const streamLesson = useCallback(async (params: StreamOptions) => {
    const currentRequest = Symbol("request");
    activeRequestRef.current = currentRequest;

    setIsLoading(true);
    setParsedLesson(null);
    setError(null);

    try {
      // FIX: Include workspaceId and conceptId to match backend ownership and validation requirements
      const lessonData = await generateLesson({
        workspaceId: params.workspaceId,
        workspaceTitle: params.workspaceTitle,
        conceptId: params.conceptId,
        conceptTitle: params.conceptTitle,
        difficulty: params.difficulty,
        preferredDepth: params.preferredDepth,
      });

      if (activeRequestRef.current === currentRequest) {
        setParsedLesson(lessonData as ParsedLesson);
      }
    } catch (err: unknown) { 
      if (activeRequestRef.current === currentRequest) {
        console.error("Teacher lesson generation error:", err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : "An error occurred while generating the lesson.";
        setError(errorMessage);
      }
    } finally {
      if (activeRequestRef.current === currentRequest) {
        setIsLoading(false);
      }
    }
  }, []);

  const stopStream = useCallback(() => {
    activeRequestRef.current = null;
    setIsLoading(false);
  }, []);

  return { parsedLesson, isLoading, error, streamLesson, stopStream };
}