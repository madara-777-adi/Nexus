// Matches the difficulty enum accepted by Tier 2/3/4 and evaluator payloads.
export type LessonDifficulty = "Beginner" | "Intermediate" | "Advanced";

// Matches POST /ai/teacher/lesson-experience (lessonExperienceSchema).
export interface LearningExperiencePayload {
  conceptId: string;
  chapterId?: string;
  lessonId: string;
  workspaceId?: string;
  workspaceTitle: string;
  moduleTitle: string;
  chapterTitle?: string;
  lessonTitle: string;
  difficulty?: LessonDifficulty;
  forceRefresh?: boolean;
}

export interface Subtopic {
  id: string;
  title: string;
  description?: string;
}

export interface Flashcard {
  _id?: string;
  subtopicId: string;
  front: string;
  back: string;
  isMastered?: boolean;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answerIndex: number;
}

export interface Tier3LessonPayload {
  markdownContent: string;
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
}

export interface EvaluationResult {
  mastery: number;
  confidence: number;
  strengths: string[];
  weaknesses: string[];
  misconceptions: string[];
  missingPrerequisites: string[];
  recommendation: string;
}