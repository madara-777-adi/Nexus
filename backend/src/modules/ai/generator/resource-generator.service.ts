import { SchemaType } from "@google/generative-ai";
import { IAIProvider } from "../providers/provider.interface";
import { GeneratedResource, ResourceGeneratorContext } from "../types/ai.types";

const ResourceListSchema = {
  type: SchemaType.OBJECT,
  properties: {
    resources: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          type: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
          searchQuery: { type: SchemaType.STRING },
          estimatedTime: { type: SchemaType.STRING },
        },
        required: ["title", "type", "description", "searchQuery", "estimatedTime"],
      },
    },
  },
  required: ["resources"],
};

const RESOURCE_SYSTEM_PROMPT = `
You are the Resource Discovery Engine of NexusSpace.
Your goal is to suggest high-value external reading material, documentation, and videos for learning concepts.
Output strictly valid JSON matching the specified schema.
`;

export class ResourceGeneratorService {
  constructor(private aiProvider: IAIProvider) {}

  async generateResources(
    context: ResourceGeneratorContext
  ): Promise<GeneratedResource[]> {
    const prompt = `
Generate a list of ${context.targetCount || 3} targeted learning resources for:
Concept: "${context.conceptTitle}"
Domain: "${context.domain}"

Provide clean title, resource type, brief description, accurate Google search query to find it, and estimated time.
`;

    const response = await this.aiProvider.generate<{ resources: GeneratedResource[] }>(
      prompt,
      RESOURCE_SYSTEM_PROMPT,
      {
        responseSchema: ResourceListSchema,
        temperature: 0.2,
      }
    );

    return response.resources;
  }
}