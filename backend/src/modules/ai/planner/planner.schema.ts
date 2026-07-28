import { SchemaType } from "@google/generative-ai";

export const PlannerSchema = {
  type: SchemaType.OBJECT,
  properties: {
    nextConcept: { type: SchemaType.STRING },
    reason: { type: SchemaType.STRING },
    estimatedStudyTime: { type: SchemaType.STRING },
    revisionNeeded: { type: SchemaType.BOOLEAN },
    suggestedResources: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    suggestedDifficulty: { type: SchemaType.STRING },
  },
  required: [
    "nextConcept",
    "reason",
    "estimatedStudyTime",
    "revisionNeeded",
    "suggestedResources",
    "suggestedDifficulty",
  ],
};