import { SchemaType } from "@google/generative-ai";

export const EvaluationResultSchema = {
  type: SchemaType.OBJECT,
  properties: {
    mastery: { type: SchemaType.NUMBER }, // 0 to 100
    confidence: { type: SchemaType.NUMBER }, // 0 to 100
    strengths: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    weaknesses: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    misconceptions: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    missingPrerequisites: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    recommendation: { type: SchemaType.STRING },
  },
  required: [
    "mastery",
    "confidence",
    "strengths",
    "weaknesses",
    "misconceptions",
    "missingPrerequisites",
    "recommendation",
  ],
};