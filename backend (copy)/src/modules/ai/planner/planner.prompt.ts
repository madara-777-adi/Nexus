export const PLANNER_SYSTEM_PROMPT = `
You are the Path Planning AI of NexusSpace.
Your job is to recommend the single best next concept node or revision action for a learner based on their current workspace graph state and mastery levels.
Output ONLY JSON matching the planner schema.
`;

export const BLUEPRINT_SYSTEM_PROMPT = `
You are the Knowledge Graph Architect of NexusSpace.
Your job is to break down a learning topic into a strictly structured blueprint containing Major Concept Nodes (Pillar 1) and Topic Headings (Pillar 2).

CRITICAL RULES FOR GENERATION:
1. Generate EXACTLY 4 to 6 Major Concept Nodes in the "concepts" array.
2. Connect the concepts sequentially using the "relationships" array to form a clear learning roadmap.
3. Output ONLY valid JSON. Do not include markdown code block backticks like \`\`\`json.

REQUIRED JSON OUTPUT SCHEMA:
{
  "concepts": [
    {
      "id": "c1",
      "title": "Module 1: Core Fundamentals",
      "description": "Essential principles and initial setup."
    },
    {
      "id": "c2",
      "title": "Module 2: Practical Implementation",
      "description": "Core mechanics, state handling, and application logic."
    },
    {
      "id": "c3",
      "title": "Module 3: Advanced Architecture",
      "description": "In-depth patterns, optimization, and edge cases."
    },
    {
      "id": "c4",
      "title": "Module 4: Ecosystem & Production",
      "description": "Best practices, testing, and production deployment."
    }
  ],
  "relationships": [
    {
      "source": "c1",
      "target": "c2",
      "type": "DEPENDS_ON"
    },
    {
      "source": "c2",
      "target": "c3",
      "type": "DEPENDS_ON"
    },
    {
      "source": "c3",
      "target": "c4",
      "type": "DEPENDS_ON"
    }
  ]
}
`;

export const EXPAND_NODE_SYSTEM_PROMPT = `
You are the Knowledge Graph Architect of NexusSpace.
Your job is to break down a specific Tier 2 Core Module into 3 to 5 Tier 3 Atomic Lessons.
Connect each new Tier 3 lesson to its parent Tier 2 concept ID with type "CONTAINS" or "DEPENDS_ON".
Output ONLY JSON matching the Tier3ExpansionSchema.
`;

export function buildPlannerPrompt(context: {
  graphNodes: string[];
  completedNodes: string[];
  masteryMap: Record<string, number>;
  availableTimeMinutes?: number;
}): string {
  return `
Analyze the workspace state and determine the best next step.

Workspace Context:
- Available Nodes: ${JSON.stringify(context.graphNodes)}
- Completed Nodes: ${JSON.stringify(context.completedNodes)}
- Current Mastery Map: ${JSON.stringify(context.masteryMap)}
- Available Time: ${context.availableTimeMinutes || 30} minutes

Return a structured JSON path plan.
`;
}

export function buildBlueprintPrompt(context: {
  title: string;
  description?: string;
}): string {
  return `
Generate a foundational Pillar 1 knowledge graph blueprint for:
Workspace Topic: "${context.title}"
Description: "${context.description || "General domain overview"}"

Rules:
1. Return 4 to 6 logical sequential modules in the "concepts" array.
2. Connect them sequentially in the "relationships" array.
`;
}

export function buildExpandNodePrompt(context: {
  workspaceTitle: string;
  parentConceptTitle: string;
  parentConceptDescription?: string;
}): string {
  return `
Expand the following Tier 2 Core Module into Tier 3 Atomic Lessons within the workspace "${context.workspaceTitle}":

Parent Module: "${context.parentConceptTitle}"
Description: "${context.parentConceptDescription || "Core module overview"}"

Rules:
1. Generate 3 to 5 atomic, granular lessons (tier: 3).
2. Ensure relationships connect the parent module to these new atomic lessons.
`;
}