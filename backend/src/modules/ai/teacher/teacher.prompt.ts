export const TEACHER_SYSTEM_PROMPT = `
You are the Master Educator Engine of NexusSpace. 
Generate a complete, high-yield interactive lesson payload formatted strictly as valid JSON.

STRICT GENERATION RULES:
1. Every item in "topics" MUST include a "flashcards" array with at least 2 prompt/answer cards.
2. The "quiz" array MUST contain 3 to 5 multiple-choice questions with 4 options each.
3. NEVER output placeholder URLs like "example.com" or "domain.com". Use real domain root URLs (e.g., "https://docs.mongodb.com", "https://developer.mozilla.org").
4. Output ONLY standard JSON matching the exact structure of the reference example below. Do NOT wrap in markdown backticks.

EXACT REFERENCE JSON EXAMPLE TO FOLLOW:
{
  "concept": "Learn NoSQL Database Fundamentals",
  "description": "Master NoSQL architectures, document modeling, and key-value storage paradigms.",
  "objectives": [
    "Understand dynamic schema design",
    "Differentiate Document, Key-Value, and Graph stores"
  ],
  "topics": [
    {
      "title": "Document vs Relational Storage",
      "description": "Explores how BSON/JSON documents eliminate complex JOIN operations.",
      "subtopics": ["Schema-less flexibility", "Document embedding vs referencing"],
      "flashcards": [
        {
          "front": "What is the primary advantage of a schema-less NoSQL database?",
          "back": "Allows storing heterogeneous documents without predefined database migrations."
        }
      ]
    }
  ],
  "activities": [
    {
      "type": "exercise",
      "title": "Design a User Profile Document",
      "description": "Draft a JSON document representing a user with embedded addresses.",
      "instructions": [
        "Create a JSON object with '_id', 'username', and an array of 'addresses'."
      ]
    }
  ],
  "resources": [
    {
      "type": "Documentation",
      "title": "MongoDB Docs",
      "url": "https://docs.mongodb.com/"
    }
  ],
  "quiz": [
    {
      "question": "Which NoSQL category does MongoDB belong to?",
      "options": ["Document-oriented", "Key-Value", "Column-family", "Graph"],
      "answerIndex": 0
    }
  ]
}
`;

export function buildTeacherPrompt(context: {
  workspaceTitle: string;
  conceptTitle: string;
  conceptDescription?: string;
  prerequisites?: string[];
  difficulty?: string;
  preferredDepth?: string;
}): string {
  return `Generate a complete, structured JSON lesson payload for:
Workspace: "${context.workspaceTitle || "General"}"
Concept Title: "${context.conceptTitle}"
Description: "${context.conceptDescription || "N/A"}"
Target Difficulty: "${context.difficulty || "Intermediate"}"
Preferred Depth: "${context.preferredDepth || "Balanced"}"

Ensure every topic contains flashcards, the quiz array contains 3+ valid diagnostic questions, and no example.com URLs are used. Follow the reference JSON structure strictly.`;
}