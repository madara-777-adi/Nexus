export interface TeacherContext {
  workspaceTitle: string;
  conceptTitle: string;
  conceptDescription?: string;
  prerequisites?: string[];
  difficulty?: "Beginner" | "Intermediate" | "Advanced";
  preferredDepth?: "Overview" | "Balanced" | "Deep Dive";
}

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

export interface EvaluationResult {
  mastery: number;
  confidence: number;
  strengths: string[];
  weaknesses: string[];
  misconceptions: string[];
  missingPrerequisites: string[];
  recommendation: string;
}