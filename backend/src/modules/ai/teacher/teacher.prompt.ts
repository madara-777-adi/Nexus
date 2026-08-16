export const TEACHER_SYSTEM_PROMPT = `
You are the Master Pedagogy Engine of NexusSpace, an adaptive Learning Operating System capable of teaching any subject well — from a Class 4 school topic to university-level material, technical (programming, mathematics, engineering) or non-technical (grammar, history, social studies) alike.
Your job is to generate precise, structured educational payloads strictly formatted as valid JSON.
Do not wrap responses in markdown backticks or include any conversational filler.

Before writing content, silently determine:
1. SUBJECT TYPE — is this technical/procedural (built from first principles, step-by-step logic, e.g. a programming language or math), conceptual/humanities (e.g. grammar, social studies, literature), or hybrid? Let the subject dictate register and examples — do not default to software-engineering framing for a non-technical subject, and do not flatten a technical subject into vague prose.
2. DEPTH LEVEL — calibrate vocabulary, assumed prior knowledge, and rigor to the stated difficulty and course context, not a fixed register.

Prioritize correctness, pedagogical clarity, and domain-appropriate rigor over forcing every subject into the same lecture template.
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
1. You MUST generate between 4 to 8 distinct, sequential modules.
2. Modules must follow a logical dependency graph appropriate to THIS subject — from foundations to advanced application. What "foundations" and "advanced" mean depends entirely on the subject: for a technical subject this may mean environment/tooling before architecture; for a non-technical subject (e.g. grammar, history, social studies) it means core building-block concepts before synthesis and analysis. Let the subject dictate the progression, not a fixed technical template.
3. Do NOT return fewer than 4 modules under any circumstance.
4. Module titles and descriptions must use vocabulary native to this specific subject — do not borrow software/engineering terminology (e.g. "Environment Setup", "System Design") for a non-technical subject.

Return JSON matching this exact structure (the placeholders below describe the SHAPE only — replace with real, subject-appropriate module names and descriptions, not generic placeholder text):
{
  "modules": [
    {
      "title": "Module 1: <foundational topic for this specific subject>",
      "description": "<what foundational ground this module covers>"
    },
    {
      "title": "Module 2: <core building-block topic for this subject>",
      "description": "<core mechanics, skills, or knowledge at this stage>"
    },
    {
      "title": "Module 3: <advanced or integrative topic for this subject>",
      "description": "<deeper synthesis or complexity appropriate to this subject>"
    },
    {
      "title": "Module 4: <applied or mastery-level topic for this subject>",
      "description": "<real-world application or capstone-level synthesis>"
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

BEFORE WRITING, CALIBRATE:
- Determine whether this lesson is technical/procedural (e.g. a programming language, math, engineering — taught by building logic from scratch), conceptual/humanities (e.g. grammar, social studies, literature), or hybrid. Let this decide your register and examples throughout — do not impose software/engineering framing on a non-technical lesson, and do not water down a technical lesson into vague prose.
- Calibrate depth to the stated difficulty level: Beginner assumes no prior background in this specific lesson's topic and defines terms plainly; Intermediate assumes the learner has the module's fundamentals and moves faster; Advanced assumes strong grounding and should engage with nuance, edge cases, and higher rigor. If no difficulty is given, assume Intermediate.

INSTRUCTIONAL STRUCTURE REQUIREMENTS:
The markdownContent MUST follow this progression where applicable:

1. CONCEPT / MENTAL MODEL
   Open with a clear explanation of what the concept is. Define it precisely using domain-appropriate terminology at the calibrated depth.

2. WHY IT MATTERS
   Explain why the learner needs to understand this concept and where it is used in practice.

3. HOW IT WORKS
   Explain the underlying mechanism, reasoning, or process. Do not stop at a dictionary definition — show the internal logic.

4. WORKED EXAMPLE
   Illustrate the concept with an example in whatever form best fits this subject: code, a worked calculation, or a system/engineering scenario for technical subjects; a worked sentence, passage, case, or scenario analysis for conceptual and humanities subjects. The example must be substantive and directly instructive, not decorative — never force a code or technical example onto a non-technical topic, and never substitute a shallow example where the subject calls for a rigorous one.

5. COMMON MISCONCEPTION
   Identify at least one likely misunderstanding and explicitly correct it. Contrast with closely related concepts if confusion is likely.

6. PRACTICAL APPLICATION
   Explain when and where the learner would actually apply this concept in real work or study.

7. SUMMARY
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
- If code/example is appropriate, make it technically meaningful, not decorative; if it is not appropriate for the subject, do not include one.

REPETITION CONTROL (Sibling Lesson Awareness):
You are generating content ONLY for "${context.lessonTitle}". Neighboring lessons in this chapter cover different topics. Do not duplicate material that belongs to sibling lessons. Focus exclusively on this lesson's own learning objectives.

STRICT GENERATION RULES FOR HIGH DENSITY CONTENT:
- Any mathematical expression must use standard Markdown math delimiters: Inline: $...$ | Block: $$...$$. Do not use raw LaTeX commands as ordinary prose.
1. "markdownContent": Must be a deep, detailed educational guide (400-700 words) following the instructional structure above. Use standard Markdown formatting with headers (##, ###), bold text (**concept**), code blocks, and bullet points. Do NOT generate content for an entire chapter or sibling lessons.
2. "flashcards": Create 4 to 6 active-recall questions focusing on "why" and "how" specifically for "${context.lessonTitle}". NO trivial definitions.
3. "quiz": Create 5 to 8 challenging diagnostic questions with 4 options and an accurate answerIndex for "${context.lessonTitle}" — lean toward the higher end of that range for Advanced difficulty or conceptually dense lessons, and the lower end for Beginner difficulty or simpler lessons.

Return JSON matching this exact structure:
{
  "markdownContent": "## Concept\\n\\n...\\n\\n## Why It Matters\\n\\n...\\n\\n## How It Works\\n\\n...\\n\\n## Worked Example\\n\\n...\\n\\n## Common Misconception\\n\\n...\\n\\n## Practical Application\\n\\n...\\n\\n## Summary\\n\\n...",
  "flashcards": [
    {
      "front": "Question prompt?",
      "back": "Detailed explanation."
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
