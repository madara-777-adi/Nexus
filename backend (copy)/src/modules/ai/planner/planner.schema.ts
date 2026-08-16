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

// 2-Tier Knowledge Graph Blueprint Schema (Tier 1 Pillars -> Tier 2 Core Modules)
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
          tier: { type: SchemaType.NUMBER }, // 1 = Major Pillar, 2 = Core Module
        },
        required: ["id", "title", "description", "tier"],
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

// Schema for Lazy Expansion of a Tier 2 node into Tier 3 Atomic Lessons
export const Tier3ExpansionSchema = {
  type: SchemaType.OBJECT,
  properties: {
    atomicLessons: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING },
          title: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
          tier: { type: SchemaType.NUMBER }, // Fixed at 3
        },
        required: ["id", "title", "description", "tier"],
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
  required: ["atomicLessons", "relationships"],
};
