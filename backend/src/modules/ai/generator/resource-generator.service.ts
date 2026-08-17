import { ProviderFactory } from "../providers/provider.factory";
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
    context: ResourceGeneratorContext,
  ): Promise<GeneratedResource[]> {
    const prompt = `
Generate a list of ${context.targetCount || 3} targeted learning resources for:
Concept: "${context.conceptTitle}"
Domain: "${context.domain}"

Output strictly valid JSON.
`;

    // Uses Tier1 provider (matches this call's previous "organizer" role mapping).
    const response = await ProviderFactory.getInstance()
      .getTier1Provider()
      .generate<any>(prompt, RESOURCE_SYSTEM_PROMPT, { temperature: 0.2 });

    // Defensive normalization (same pattern as TeacherService): the AI
    // response is never trusted to match the requested shape exactly, so
    // every field is validated/defaulted here before it can reach the
    // frontend with a missing key or wrong type.
    const rawResources = Array.isArray(response?.resources)
      ? response.resources
      : [];

    const validTypes: GeneratedResource["type"][] = [
      "Article",
      "Documentation",
      "Video",
      "Book",
      "Interactive",
    ];

    return rawResources
      .map((r: any) => ({
        title: String(r?.title || "").trim(),
        type: validTypes.includes(r?.type) ? r.type : "Article",
        description: String(r?.description || "").trim(),
        searchQuery: String(r?.searchQuery || context.conceptTitle),
        estimatedTime: String(r?.estimatedTime || "15 mins"),
      }))
      .filter((r: GeneratedResource) => r.title.length > 0);
  }
}

export const resourceGeneratorService = new ResourceGeneratorService();
