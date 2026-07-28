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

// Schema for generating the initial knowledge graph blueprint
export const BlueprintSchema = {
  type: SchemaType.OBJECT,
  properties: {
    concepts: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING },
          title: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
        },
        required: ["id", "title", "description"],
      },
    },
    relationships: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          sourceConceptId: { type: SchemaType.STRING },
          targetConceptId: { type: SchemaType.STRING },
          type: { type: SchemaType.STRING },
        },
        required: ["sourceConceptId", "targetConceptId", "type"],
      },
    },
  },
  required: ["concepts", "relationships"],
};