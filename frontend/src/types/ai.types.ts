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