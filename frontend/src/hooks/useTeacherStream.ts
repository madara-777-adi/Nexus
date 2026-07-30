import { useState, useCallback, useRef } from "react";
import { generateLesson } from "../api/ai.api";

export interface TopicItem {
  title: string;
  description: string;
  subtopics?: string[];
}

export interface ActivityItem {
  type: string;
  title: string;
  description: string;
  instructions?: string[];
  questions?: Array<{
    question: string;
    options: string[];
    answer?: string;
  }>;
}

export interface ResourceItem {
  type: string;
  title: string;
  url: string;
}

export interface AssessmentItem {
  type: string;
  title: string;
  description: string;
  requirements?: string[];
  questions?: Array<{
    question: string;
    options: string[];
    answer?: string;
  }>;
}

export interface ParsedLesson {
  concept?: string;
  domain?: string;
  description?: string;
  difficulty?: string;
  depth?: string;
  objectives?: string[];
  topics?: TopicItem[];
  activities?: ActivityItem[];
  resources?: ResourceItem[];
  assessment?: AssessmentItem;
  quiz?: Array<{
    question: string;
    options: string[];
    answer?: string;
  }>;
}

interface StreamOptions {
  workspaceId: string;
  workspaceTitle: string;
  conceptId: string;
  conceptTitle: string;
  difficulty?: string;
  preferredDepth?: string;
  forceRefresh?: boolean;
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

  const streamLesson = useCallback(async (params: StreamOptions) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setParsedLesson(null);
    setError(null);

    try {
      const rawData = await generateLesson({
        workspaceId: params.workspaceId,
        workspaceTitle: params.workspaceTitle,
        conceptId: params.conceptId,
        conceptTitle: params.conceptTitle,
        difficulty: params.difficulty,
        preferredDepth: params.preferredDepth,
        ...(params.forceRefresh ? { forceRefresh: true } : {}),
      });

      if (controller.signal.aborted) return;

      let unpacked: any = rawData;
      if (typeof unpacked === "string") {
        try {
          unpacked = JSON.parse(unpacked);
        } catch {
          // keep raw string if JSON parsing fails
        }
      }

      if (unpacked?.data) unpacked = unpacked.data;

      // Multi-path quiz extraction to catch all possible AI response shapes
      let quizList: any[] = [];

      if (Array.isArray(unpacked?.quiz) && unpacked.quiz.length > 0) {
        quizList = unpacked.quiz;
      } else if (
        Array.isArray(unpacked?.questions) &&
        unpacked.questions.length > 0
      ) {
        quizList = unpacked.questions;
      } else if (Array.isArray(unpacked?.activities)) {
        for (const act of unpacked.activities) {
          if (Array.isArray(act?.questions) && act.questions.length > 0) {
            quizList = act.questions;
            break;
          }
        }
      } else if (Array.isArray(unpacked?.assessment?.questions)) {
        quizList = unpacked.assessment.questions;
      }

      const normalizedLesson: ParsedLesson = {
        ...unpacked,
        quiz: quizList,
      };

      setParsedLesson(normalizedLesson);
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
  }, []);

  return { parsedLesson, isLoading, error, streamLesson, stopStream };
}
