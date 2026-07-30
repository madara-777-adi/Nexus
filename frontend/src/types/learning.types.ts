export const ConceptStatus = {
  LOCKED: "LOCKED",
  UNLOCKED: "UNLOCKED",
  IN_PROGRESS: "IN_PROGRESS",
  MASTERED: "MASTERED",
} as const;

export type ConceptStatus = (typeof ConceptStatus)[keyof typeof ConceptStatus];

export interface ILearningProgress {
  progressId: string;
  user: string;
  workspace: string;
  concept: {
    _id: string;
    conceptId: string;
    title: string;
    level?: string;
  };
  status: ConceptStatus;
  masteryScore: number;
  attemptsCount: number;
  lastEvaluatedAt?: string;
}

export interface EvaluationRecordResponse {
  progress: ILearningProgress;
  unlockedDownstreamIds: string[];
}

// --- Pillar 3 Pedagogy & Flashcard Interfaces ---

export interface IFlashcard {
  front: string;
  back: string;
}

export interface ITopic {
  title?: string;
  topicName?: string;
  description?: string;
  subtopics?: string[];
  flashcards?: IFlashcard[];
}

export interface ILessonResource {
  type?: string;
  resourceType?: string;
  title?: string;
  resourceName?: string;
  url?: string;
  resourceUrl?: string;
}

export interface ILessonActivity {
  type?: string;
  title?: string;
  description?: string;
  instructions?: string[];
}

export interface IQuizQuestion {
  question: string;
  options: string[];
  answerIndex?: number;
  answer?: string;
}

export interface IParsedLesson {
  concept?: string;
  conceptName?: string;
  domain?: string;
  description?: string;
  objectives?: string[];
  learningObjectives?: string[];
  topics?: ITopic[];
  activities?: ILessonActivity[];
  resources?: ILessonResource[];
  assessment?: any;
  quiz?: IQuizQuestion[];
}