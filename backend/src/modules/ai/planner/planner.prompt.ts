export const PLANNER_SYSTEM_PROMPT = `
You are the Path Planning AI of NexusSpace.
Your job is to recommend the single best next concept node or revision action for a learner based on their current workspace graph state and mastery levels.
Output ONLY JSON matching the planner schema.
`;

export const BLUEPRINT_SYSTEM_PROMPT = `
You are the Knowledge Graph Architect of NexusSpace.
Your job is to break down a learning topic into a strictly structured blueprint containing Pillar 1 (Major Concept Nodes) and Pillar 2 (Micro-Curriculum Topics).

CRITICAL RULES FOR GENERATION:
1. Generate exactly 4 to 6 Major Concept Nodes (Pillar 1).
2. For EVERY Concept Node, generate 3 to 4 specific Topic Headings (Pillar 2).
3. Connect the nodes logically using the "dependsOn" array to form a learning path.
4. You MUST follow the EXACT JSON key naming structure below. Output ONLY valid JSON. Do not include markdown code block backticks like \`\`\`json.

REQUIRED JSON OUTPUT SCHEMA:
{
  "blueprint": [
    {
      "conceptId": "c1",
      "title": "Title of the Major Concept (e.g., Asynchronous JavaScript)",
      "description": "A clear, concise summary of this concept.",
      "tier": 1,
      "dependsOn": [], 
      "topics": [
        {
          "title": "Topic Heading (e.g., Understanding Promises)",
          "description": "Brief summary of what this topic entails.",
          "subtopics": ["Subtopic 1", "Subtopic 2"]
        }
      ]
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
Generate a foundational Pillar 1 and Pillar 2 knowledge graph blueprint for:
Workspace Topic: "${context.title}"
Description: "${context.description || "General domain overview"}"

Ensure the first concept has an empty "dependsOn" array, and subsequent concepts depend on the IDs of previous foundational concepts.
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