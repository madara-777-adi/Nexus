export const TEACHER_SYSTEM_PROMPT = `
You are the Master Pedagogy Engine of NexusSpace, a highly technical Learning Operating System.
Your job is to generate precise, structured educational payloads strictly formatted as valid JSON.
Do not wrap responses in markdown backticks or include any conversational filler.
Prioritize technical accuracy, deep architectural explanations, and practical mental models over rote vocabulary.
`;

/**
 * TIER 1: Generate Top-Level Modules (1st Pillars)
 * Called once when the user creates a new workspace.
 */
export function buildTier1ModulesPrompt(context: {
  workspaceTitle: string;
  workspaceDescription?: string;
}): string {
  return `
Create a progressive 4-to-6 module learning roadmap for the subject: "${context.workspaceTitle}".
Context: ${context.workspaceDescription || "N/A"}

STRICT RULES:
1. You MUST generate between 4 and 6 distinct, sequential modules.
2. Modules must follow a logical dependency graph (from core fundamentals to advanced application).
3. Do NOT return fewer than 4 modules under any circumstance.

Return JSON matching this exact structure:
{
  "modules": [
    {
      "title": "Module 1: Fundamentals & Environment Setup",
      "description": "Foundational mechanics, environment configuration, and basic syntax."
    },
    {
      "title": "Module 2: Core Data Structures & Logic",
      "description": "Essential control flow, data handling, and structural patterns."
    },
    {
      "title": "Module 3: Advanced Concepts & System Design",
      "description": "In-depth architecture, optimization, and real-world implementation."
    },
    {
      "title": "Module 4: Practical Projects & Master Application",
      "description": "Hands-on implementation and production-grade concepts."
    }
  ]
}
`;
}

/**
 * TIER 2: Generate Subtopics (2nd Pillars)
 * Called ONLY when a user clicks an unlocked Module node.
 */
export function buildTier2SubtopicsPrompt(context: {
  workspaceTitle: string;
  moduleTitle: string;
  moduleDescription?: string;
}): string {
  return `
Break down the module "${context.moduleTitle}" (within the course "${context.workspaceTitle}") into 3 to 5 core subtopics.
Module Description: ${context.moduleDescription || "N/A"}

Return JSON matching this exact structure:
{
  "subtopics": [
    {
      "id": "slugified-subtopic-title",
      "title": "Subtopic Name",
      "description": "Short explanation of the specific technical concept."
    }
  ]
}
`;
}

/**
 * TIER 3: Deep Lesson & Active Recall (The Deep Dive)
 * Called ONLY when a user clicks a specific Subtopic to actually learn.
 */
export function buildTier3LessonPrompt(context: {
  workspaceTitle: string;
  moduleTitle: string;
  subtopicTitle: string;
}): string {
  return `
Generate a deep, comprehensive lesson payload for the subtopic "${context.subtopicTitle}" (Module: "${context.moduleTitle}", Course: "${context.workspaceTitle}").

STRICT GENERATION RULES FOR HIGH DENSITY CONTENT:
1. "markdownContent": Must be a deep, detailed educational guide (300-500 words). Use standard Markdown formatting with headers (##, ###), bold text (**concept**), code blocks, and bullet points. Do NOT escape headers.
2. "flashcards": Create 4 to 6 active-recall questions focusing on "why" and "how" (e.g., edge cases, mechanisms). NO trivial definitions.
3. "quiz": Create 3 challenging diagnostic questions with 4 options and an accurate answerIndex.

Return JSON matching this exact structure:
{
  "markdownContent": "## Overview\\n\\nDetailed content...",
  "flashcards": [
    {
      "front": "How does X differ from Y under heavy load?",
      "back": "Detailed 2-3 sentence technical explanation with example."
    }
  ],
  "quiz": [
    {
      "question": "Which mechanism prevents resource deadlock in this architecture?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answerIndex": 1
    }
  ]
}
`;
}
