// TEACHER TYPES
export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface TeacherLesson {
  title: string;
  overview: string;
  definition: string;
  why: string;
  intuition: string;
  analogy: string;
  explanation: string;
  examples: string[];
  commonMistakes: string[];
  keyPoints: string[];
  quiz: QuizQuestion[];
  summary: string;
  recommendedResources: string[];
}

export interface TeacherContext {
  workspaceTitle: string;
  conceptTitle: string;
  conceptDescription?: string;
  prerequisites?: string[];
  difficulty?: "Beginner" | "Intermediate" | "Advanced";
  preferredDepth?: "Overview" | "Balanced" | "Deep Dive";
}

// EVALUATOR TYPES
export interface LearnerAnswer {
  questionId?: string;
  question: string;
  userAnswer: string;
  correctAnswer?: string;
}

export interface EvaluationResult {
  mastery: number; // 0 - 100
  confidence: number; // 0 - 100
  strengths: string[];
  weaknesses: string[];
  misconceptions: string[];
  missingPrerequisites: string[];
  recommendation: string;
}

export interface EvaluatorContext {
  conceptTitle: string;
  questions: any[];
  learnerAnswers: LearnerAnswer[];
}

// PLANNER TYPES
export interface PathPlan {
  nextConcept: string;
  reason: string;
  estimatedStudyTime: string;
  revisionNeeded: boolean;
  suggestedResources: string[];
  suggestedDifficulty: string;
}

export interface PlannerContext {
  graphNodes: string[];
  completedNodes: string[];
  masteryMap: Record<string, number>;
  availableTimeMinutes?: number;
}

// RESOURCE GENERATOR TYPES
export interface GeneratedResource {
  title: string;
  type: "Article" | "Documentation" | "Video" | "Book" | "Interactive";
  description: string;
  searchQuery: string;
  estimatedTime: string;
}

export interface ResourceGeneratorContext {
  conceptTitle: string;
  domain: string;
  targetCount?: number;
}

// QUIZ GENERATOR TYPES
export interface StandaloneQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  hint?: string;
}

export interface QuizSet {
  topic: string;
  difficulty: string;
  questions: StandaloneQuizQuestion[];
}

export interface QuizGeneratorContext {
  conceptTitle: string;
  questionCount?: number;
  difficulty?: "Beginner" | "Intermediate" | "Advanced";
}