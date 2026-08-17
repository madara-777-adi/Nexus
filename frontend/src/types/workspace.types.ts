export interface IWorkspace {
  _id: string;
  workspaceId: string;
  title: string;
  description?: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkspacePayload {
  title: string;
  description?: string;
}

export interface UpdateWorkspacePayload {
  title?: string;
  description?: string;
}

// Matches backend modules/concept/models/concept.model.ts exactly.
export interface ILessonNode {
  id: string;
  title: string;
  description?: string;
  order: number;
  estimatedMinutes: number;
  generationStatus: "PENDING" | "GENERATING" | "COMPLETED" | "FAILED";
}

// Matches backend modules/concept/models/concept.model.ts exactly.
export interface IConceptTopic {
  id: string;
  title: string;
  description?: string;
  order: number;
  estimatedMinutes: number;
  generationStatus: "PENDING" | "GENERATING" | "COMPLETED" | "FAILED";
  unlockRequirements?: Record<string, unknown>;
  lessons?: ILessonNode[];
}

export interface IConcept {
  _id: string;
  conceptId: string;
  workspace: string;
  owner: string;
  title: string;
  description?: string;
  order: number;
  isUnlocked: boolean;
  isMastered: boolean;
  topics: IConceptTopic[];
  createdAt: string;
  updatedAt: string;
}
