import { groqProvider } from "../providers/groq.provider";
import { GeneratedResource, ResourceGeneratorContext } from "../types/ai.types";

const RESOURCE_SYSTEM_PROMPT = `
You are the Resource Discovery Engine of NexusSpace.
Your goal is to suggest high-value external reading material, documentation, and videos for learning concepts.

You MUST respond strictly in valid JSON format. 
The JSON response must be a single object containing a "resources" array.
Each object within the "resources" array must contain these exact string keys:
- "title": The name of the resource.
- "type": The format (e.g., "Video", "Documentation", "Article", "Interactive").
- "description": A concise, 1-2 sentence summary of what the resource covers.
- "searchQuery": The optimal, highly specific Google search string a user can copy/paste to find this exact resource.
- "estimatedTime": Estimated time to consume (e.g., "15 mins", "1 hour").
`;

export class ResourceGeneratorService {
  async generateResources(
    context: ResourceGeneratorContext
  ): Promise<GeneratedResource[]> {
    const prompt = `
Generate a list of ${context.targetCount || 3} targeted learning resources for:
Concept: "${context.conceptTitle}"
Domain: "${context.domain}"

Output strictly valid JSON.
`;

    // Direct, typed call using your existing groqProvider instance and the "organizer" role
    const response = await groqProvider.generateJSON(
      prompt,
      RESOURCE_SYSTEM_PROMPT,
      "organizer",
      { temperature: 0.2 }
    );

    return response.resources || [];
  }
}

export const resourceGeneratorService = new ResourceGeneratorService();