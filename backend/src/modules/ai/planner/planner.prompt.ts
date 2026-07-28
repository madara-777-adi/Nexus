export const PLANNER_SYSTEM_PROMPT = `
You are the Path Planning AI of NexusSpace.
Your job is to recommend the single best next concept node or revision action for a learner based on their current workspace graph state and mastery levels.
Output ONLY JSON matching the planner schema.
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