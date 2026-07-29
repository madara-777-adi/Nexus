export const PLANNER_SYSTEM_PROMPT = `
You are the Path Planning AI of NexusSpace.
Your job is to recommend the single best next concept node or revision action for a learner based on their current workspace graph state and mastery levels.
Output ONLY JSON matching the planner schema.
`;

export const BLUEPRINT_SYSTEM_PROMPT = `
You are the Knowledge Graph Architect of NexusSpace.
Your job is to break down a learning topic into a structured, 2-tier knowledge graph:
- Tier 1: 2 to 3 Major Pillars (foundational macro topics).
- Tier 2: 2 to 3 Core Modules attached to each Tier 1 Pillar.
Total nodes generated should be between 6 and 9 nodes.
Do NOT generate Tier 3 atomic lessons yet (they will be lazy-loaded on user click).
Output ONLY JSON matching the blueprint schema.
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
Generate a foundational 2-tier knowledge graph blueprint for:
Topic: "${context.title}"
Description: "${context.description || "General domain overview"}"

Rules:
1. Provide 2-3 Tier 1 Major Pillars (tier: 1).
2. Provide 2-3 Tier 2 Core Modules per Pillar (tier: 2).
3. Connect Tier 1 to Tier 2 using relationship type "DEPENDS_ON" or "CONTAINS".
4. Use simple string IDs like "c1", "c2", "c3".
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
