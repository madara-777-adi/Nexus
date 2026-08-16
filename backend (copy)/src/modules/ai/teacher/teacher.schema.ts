import { SchemaType } from "@google/generative-ai";

export const TeacherTopicSchema = {
  type: SchemaType.OBJECT,
  properties: {
    topics: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
          estimatedMinutes: { type: SchemaType.NUMBER },
        },
        required: ["title", "description", "estimatedMinutes"],
      },
    },
  },
  required: ["topics"],
};

export const TeacherLessonSchema = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING },
    overview: { type: SchemaType.STRING },
    definition: { type: SchemaType.STRING },
    why: { type: SchemaType.STRING },
    intuition: { type: SchemaType.STRING },
    analogy: { type: SchemaType.STRING },
    explanation: { type: SchemaType.STRING },
    examples: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    commonMistakes: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    keyPoints: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    quiz: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          question: { type: SchemaType.STRING },
          options: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
          correctIndex: { type: SchemaType.NUMBER },
          explanation: { type: SchemaType.STRING },
        },
        required: ["question", "options", "correctIndex", "explanation"],
      },
    },
    summary: { type: SchemaType.STRING },
    recommendedResources: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
  },
  required: [
    "title",
    "overview",
    "definition",
    "why",
    "intuition",
    "analogy",
    "explanation",
    "examples",
    "commonMistakes",
    "keyPoints",
    "quiz",
    "summary",
    "recommendedResources",
  ],
};
