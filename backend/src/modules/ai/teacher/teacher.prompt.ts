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
 * TIER 2: Generate Chapters (Subdivisions of a Unit)
 * Called JIT when a Unit (Concept) is selected for Chapter generation.
 */
export function buildTier2TopicsPrompt(context: {
  conceptTitle: string;
  conceptDescription?: string;
  workspaceContext?: {
    workspaceTitle: string;
  };
  difficulty?: string;
}): string {
  const workspaceInfo = context.workspaceContext
    ? `Within Unit/Workspace: "${context.workspaceContext.workspaceTitle}"`
    : "";
  const difficultyInfo = context.difficulty
    ? `Target Difficulty Level: ${context.difficulty}`
    : "";

  return `
Your task is to generate the Chapters that make up the Unit "${context.conceptTitle}" ${workspaceInfo}.
${difficultyInfo}

Each Chapter must represent a logical subdivision of this Unit.
Chapters should build naturally upon previous chapters, covering necessary depth appropriate for the requested domain and difficulty level.

Unit Context: ${context.conceptDescription || "N/A"}

STRICT RULES:
1. Generate a comprehensive sequence of distinct, progressive Chapters appropriate for this Unit.
2. Return ONLY chapter metadata: "title", "description", and "estimatedMinutes".
3. Every Chapter title MUST be unique within this Unit.
4. Return Chapters in logical learning order.
5. Do NOT generate lessons, lesson nodes, markdown content, flashcards, quizzes, or state flags.
6. "estimatedMinutes" must be a realistic estimate per chapter (e.g., between 15 and 45 minutes).

Return JSON matching this exact structure:
{
  "topics": [
    {
      "title": "Chapter Title",
      "description": "Short explanation of the specific chapter.",
      "estimatedMinutes": 20
    }
  ]
}
`;
}

/**
 * TIER 3: Generate Lesson Nodes (Atomic Learnable Topics inside a Chapter)
 * Called JIT when a user selects a Chapter to see its learnable Lessons.
 */
export function buildTier3LessonsPrompt(context: {
  workspaceTitle: string;
  moduleTitle: string;
  chapterTitle: string;
  chapterDescription?: string;
  difficulty?: string;
}): string {
  const difficultyInfo = context.difficulty
    ? `Target Difficulty: ${context.difficulty}`
    : "";

  return `
Your task is to generate the sequence of learnable lessons contained strictly within the Chapter "${context.chapterTitle}" (Unit: "${context.moduleTitle}", Course: "${context.workspaceTitle}").
${difficultyInfo}

Chapter Context: ${context.chapterDescription || "N/A"}

STRICT RULES:
1. Generate a progressive sequence of granular, atomic lessons contained strictly within this Chapter.
2. Lessons must build logically upon preceding lessons within the Chapter.
3. Return ONLY lesson metadata: "title", "description", and "estimatedMinutes".
4. Every Lesson title MUST be unique within this Chapter.
5. Do NOT generate markdown content, code blocks, flashcards, quiz questions, explanations, or exercises.
6. "estimatedMinutes" must be a realistic estimate per lesson (e.g., between 10 and 30 minutes).

Return JSON matching this exact structure:
{
  "lessons": [
    {
      "title": "Lesson Title",
      "description": "Short explanation of what this specific lesson covers.",
      "estimatedMinutes": 15
    }
  ]
}
`;
}

/**
 * LEARNING EXPERIENCE: Deep Lesson Content, Active Recall Flashcards & Diagnostic Quiz
 * Called JIT ONLY when a learner selects a specific LessonNode to study.
 */
export function buildLearningExperiencePrompt(context: {
  workspaceTitle: string;
  moduleTitle: string;
  chapterTitle: string;
  lessonTitle: string;
  difficulty?: string;
}): string {
  const difficultyInfo = context.difficulty
    ? `Target Difficulty Level: ${context.difficulty}`
    : "";

  return `
Generate a deep, comprehensive learning experience payload specifically for the lesson "${context.lessonTitle}" (Chapter: "${context.chapterTitle}", Unit: "${context.moduleTitle}", Course: "${context.workspaceTitle}").
${difficultyInfo}

INSTRUCTIONAL STRUCTURE REQUIREMENTS:
The markdownContent MUST follow this progression where applicable:

1. CONCEPT / MENTAL MODEL
   Open with a clear, technical explanation of what the concept is. Define it precisely using domain-appropriate terminology.

2. WHY IT MATTERS
   Explain why the learner needs to understand this concept and where it is used in practice.

3. HOW IT WORKS
   Explain the underlying mechanism, reasoning, or process. Do not stop at a dictionary definition — show the internal logic.

4. CONCRETE EXAMPLE
   Include a realistic, domain-appropriate example that illustrates the concept in action.

5. TECHNICAL / PRACTICAL EXAMPLE
   Where the subject permits, demonstrate the concept using a technical, engineering, mathematical, code, system-design, or domain-specific example. If a technical example is not appropriate for the subject, use a rigorous domain-appropriate concrete example instead.

6. COMMON MISCONCEPTION
   Identify at least one likely misunderstanding and explicitly correct it. Contrast with closely related concepts if confusion is likely.

7. PRACTICAL APPLICATION
   Explain when and where the learner would actually apply this concept in real work or study.

8. SUMMARY
   End with a concise synthesis that ties the concept together.

CONTENT QUALITY RULES:
- Prioritize correctness and instructional clarity over brevity.
- Do not pad with repetitive prose or generic filler (e.g., "in today's world", "it is important to note").
- Do not repeat the lesson title as explanation.
- Do not restate the same idea in multiple paragraphs.
- Use examples directly relevant to this specific lesson.
- Preserve curriculum scope: do not teach unrelated concepts merely to lengthen content.
- Respect the stated learning objectives.
- Use prerequisite knowledge explicitly when explaining the concept.
- If code/example is appropriate, make it technically meaningful, not decorative.

REPETITION CONTROL (Sibling Lesson Awareness):
You are generating content ONLY for "${context.lessonTitle}". Neighboring lessons in this chapter cover different topics. Do not duplicate material that belongs to sibling lessons. Focus exclusively on this lesson's own learning objectives.

STRICT GENERATION RULES FOR HIGH DENSITY CONTENT:
- Any mathematical expression must use standard Markdown math delimiters: Inline: $...$ | Block: $$...$$. Do not use raw LaTeX commands as ordinary prose.
1. "markdownContent": Must be a deep, detailed educational guide (400-700 words) following the instructional structure above. Use standard Markdown formatting with headers (##, ###), bold text (**concept**), code blocks, and bullet points. Do NOT generate content for an entire chapter or sibling lessons.
2. "flashcards": Create 4 to 6 active-recall questions focusing on "why" and "how" specifically for "${context.lessonTitle}". NO trivial definitions.
3. "quiz": Create 3 challenging diagnostic questions with 4 options and an accurate answerIndex for "${context.lessonTitle}".

Return JSON matching this exact structure:
{
  "markdownContent": "## Concept\\n\\n...\\n\\n## Why It Matters\\n\\n...\\n\\n## How It Works\\n\\n...\\n\\n## Concrete Example\\n\\n...\\n\\n## Technical Example\\n\\n...\\n\\n## Common Misconception\\n\\n...\\n\\n## Practical Application\\n\\n...\\n\\n## Summary\\n\\n...",
  "flashcards": [
    {
      "front": "Question prompt?",
      "back": "Detailed technical explanation."
    }
  ],
  "quiz": [
    {
      "question": "Diagnostic question?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answerIndex": 1
    }
  ]
}
`;
}
