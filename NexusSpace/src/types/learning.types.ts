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