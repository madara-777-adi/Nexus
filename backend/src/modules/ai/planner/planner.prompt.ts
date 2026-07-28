export const PLANNER_SYSTEM_PROMPT = `
You are the Path Planning AI of NexusSpace.
Your job is to recommend the single best next concept node or revision action for a learner based on their current workspace graph state and mastery levels.
Output ONLY JSON matching the planner schema.
`;

export const BLUEPRINT_SYSTEM_PROMPT = `
You are the Knowledge Graph Architect of NexusSpace.
Your job is to breakdown a learning topic into a structured, ordered acyclic knowledge graph of 5 to 10 key concepts and their prerequisite relationships.
Output ONLY JSON matching the blueprint schema.
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

export function buildBlueprintPrompt(context: { title: string; description?: string }): string {
  return `
Generate a foundational knowledge graph for the following learning goal:
Topic: "${context.title}"
Description: "${context.description || "General domain overview"}"

Rules:
1. Provide 5 to 8 essential concepts needed to master this topic.
2. Provide directed relationships between prerequisite concepts using type "DEPENDS_ON".
3. Use simple string IDs like "c1", "c2", "c3" for concept references.
`;
}