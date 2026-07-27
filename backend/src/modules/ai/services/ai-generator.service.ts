import { GoogleGenAI, Type } from "@google/genai";
import { Types } from "mongoose";
import ConceptModel from "../../concept/models/concept.model";
import WorkspaceModel from "../../workspace/models/workspace.model";
import RelationshipModel from "../../relationship/models/relationship.model";
import ResourceModel, {
  ResourceSource,
} from "../../resource/models/resource.model";
import generateUserId from "../../../shared/utils/generateUserId";
import { NotFoundError } from "../../../shared/errors/NotFoundError";
import { ForbiddenError } from "../../../shared/errors/ForbiddenError";
import { InternalServerError } from "../../../shared/errors/InternalServerError";
import env from "../../../config/env";

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

class AIGeneratorService {
  async generateConceptResource(
    conceptId: string,
    userObjectId: Types.ObjectId,
    userInstructions?: string,
  ) {
    // 1. Validate Concept and Workspace ownership
    const concept = await ConceptModel.findOne({ conceptId });
    if (!concept) throw new NotFoundError("Concept not found.");
    if (!concept.owner.equals(userObjectId)) {
      throw new ForbiddenError("You do not have access to this concept.");
    }

    const workspace = await WorkspaceModel.findById(concept.workspace);
    if (!workspace) throw new NotFoundError("Workspace domain not found.");

    // 2. Read nearby concepts for graph context
    const edges = await RelationshipModel.find({
      $or: [{ sourceConcept: concept._id }, { targetConcept: concept._id }],
    })
      .populate("sourceConcept", "title")
      .populate("targetConcept", "title")
      .limit(10);

    const nearbyTitles = Array.from(
      new Set(
        edges
          .flatMap((e: any) => [e.sourceConcept?.title, e.targetConcept?.title])
          .filter((t) => t && t !== concept.title),
      ),
    );

    // 3. Construct System & Prompt
    const systemInstruction = `You are an educational AI inside Nexus Knowledge Operating System.
Your task is to generate a structured, highly clear explanation of a single concept.
Follow these rules strictly:
- Focus on conceptual clarity over length.
- Never invent citations or fake statistics.
- Never automatically modify the user's graph; suggestions in 'relatedConcepts' are purely advisory.`;

    const prompt = `Learning Domain (Workspace): ${workspace.title}
Target Concept Name: ${concept.title}
Nearby Graph Concepts: ${nearbyTitles.length > 0 ? nearbyTitles.join(", ") : "None"}
Custom User Instructions: ${userInstructions || "Standard concise explanation"}`;

    try {
      // 4. Call Gemini using structured JSON schema output
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              definition: {
                type: Type.STRING,
                description: "Max 2 paragraphs explaining what it is.",
              },
              whyItExists: {
                type: Type.STRING,
                description: "Why it was introduced and problem it solves.",
              },
              howItWorks: {
                type: Type.STRING,
                description: "Step-by-step clear operational explanation.",
              },
              example: {
                type: Type.STRING,
                description: "One practical real-world analogy or example.",
              },
              keyPoints: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "3-5 concise summary bullets.",
              },
              commonMisconceptions: {
                type: Type.STRING,
                description: "Common beginner mistakes.",
              },
              relatedConcepts: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description:
                  "4-6 suggested concept names that could be connected.",
              },
              summary: {
                type: Type.STRING,
                description: "Concise summary under 5 lines.",
              },
            },
            required: [
              "definition",
              "whyItExists",
              "howItWorks",
              "example",
              "keyPoints",
              "commonMisconceptions",
              "relatedConcepts",
              "summary",
            ],
          },
        },
      });

      if (!response.text) {
        throw new InternalServerError(
          "Failed to get response from Gemini API.",
        );
      }

      const generatedContent = JSON.parse(response.text);

      // 5. Save generated text resource attached to Concept
      let resourceId: string;
      do {
        resourceId = `res_${generateUserId()}`;
      } while (await ResourceModel.exists({ resourceId }));

      const resource = await ResourceModel.create({
        resourceId,
        workspace: workspace._id,
        concept: concept._id,
        owner: userObjectId,
        title: `AI Knowledge: ${concept.title}`,
        source: ResourceSource.AI_GENERATED,
        content: generatedContent,
      });

      return resource;
    } catch (error: any) {
      throw new InternalServerError(
        error.message || "An error occurred during AI content generation.",
      );
    }
  }
}

export default new AIGeneratorService();
