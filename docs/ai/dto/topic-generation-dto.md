// Raw payload validated from AI response
export interface RawTopicAIOutputDTO {
  title: string;
  description: string;
  estimatedMinutes: number;
}

export interface RawTopicResponseDTO {
  topics: RawTopicAIOutputDTO[];
}

// Internal Domain DTO populated after backend transformation
export interface PersistableTopicDTO {
  id: string;
  title: string;
  description: string;
  order: number;
  estimatedMinutes: number;
  generationStatus: "PENDING" | "GENERATING" | "COMPLETED" | "FAILED";
  unlockRequirements: Record<string, unknown>;
}