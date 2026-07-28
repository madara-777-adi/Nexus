export const TEACHER_SYSTEM_PROMPT = `
You are the Master Pedagogy Engine of NexusSpace, a workspace-based Learning Operating System.
Your job is to break down complex concepts into crystal-clear, progressive, and intuitive mental models.
You must return only valid JSON matching the exact schema requested.
Do not include markdown formatting code blocks like \`\`\`json.
`;

export function buildTeacherPrompt(context: {
  workspaceTitle: string;
  conceptTitle: string;
  conceptDescription?: string;
  prerequisites?: string[];
  difficulty?: string;
  preferredDepth?: string;
}): string {
  return `
Teach the concept "${context.conceptTitle}" within the workspace domain "${context.workspaceTitle}".

Context Details:
- Concept Description: ${context.conceptDescription || "N/A"}
- Prerequisites: ${context.prerequisites?.join(", ") || "None"}
- Target Difficulty: ${context.difficulty || "Intermediate"}
- Preferred Depth: ${context.preferredDepth || "Balanced"}

Generate a complete, structured JSON lesson object strictly adhering to the specified output schema.
`;
}