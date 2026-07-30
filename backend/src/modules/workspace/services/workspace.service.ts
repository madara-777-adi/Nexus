import { Types } from "mongoose";
import Workspace, {
  IWorkspace,
  WorkspaceVisibility,
} from "../models/workspace.model";
import Concept from "../../concept/models/concept.model";
import Relationship, {
  RelationshipType,
} from "../../relationship/models/relationship.model";
import {
  CreateWorkspaceDTO,
  UpdateWorkspaceDTO,
} from "../validators/workspace.validator";
import generateUserId from "../../../shared/utils/generateUserId";
import { NotFoundError } from "../../../shared/errors/NotFoundError";
import { ForbiddenError } from "../../../shared/errors/ForbiddenError";
import { plannerService } from "../../ai/planner/planner.service";

class WorkspaceService {
  async createWorkspace(
    ownerObjectId: Types.ObjectId,
    dto: CreateWorkspaceDTO,
  ): Promise<IWorkspace> {
    // 1. Generate unique custom ID
    let workspaceId: string;
    do {
      workspaceId = `ws_${generateUserId()}`;
    } while (await Workspace.exists({ workspaceId }));

    // 2. Create the Workspace document shell
    const workspace = await Workspace.create({
      workspaceId,
      owner: ownerObjectId,
      title: dto.title,
      description: dto.description || "",
      visibility: dto.visibility || WorkspaceVisibility.PRIVATE,
    });

    // 3. Generate initial AI blueprint concepts & relationships using PlannerService
    try {
      console.log(
        `[AI Planner] Generating blueprint for workspace: "${dto.title}"`,
      );

      const planResult = await plannerService.generateBlueprint({
        title: dto.title,
        description:
          dto.description || `Learning curriculum and topics for ${dto.title}`,
      });

      console.log(
        "[AI Planner] Raw output received:",
        JSON.stringify(planResult),
      );

      // Robustly extract concepts array from all possible Groq JSON responses
      let rawConcepts: any[] = [];
      let rawRelationships: any[] = [];

      if (Array.isArray(planResult?.concepts)) {
        rawConcepts = planResult.concepts;
      } else if (Array.isArray(planResult?.blueprint)) {
        rawConcepts = planResult.blueprint;
      } else if (Array.isArray(planResult?.data?.concepts)) {
        rawConcepts = planResult.data.concepts;
      } else if (Array.isArray(planResult?.data?.blueprint)) {
        rawConcepts = planResult.data.blueprint;
      }

      if (Array.isArray(planResult?.relationships)) {
        rawRelationships = planResult.relationships;
      } else if (Array.isArray(planResult?.data?.relationships)) {
        rawRelationships = planResult.data.relationships;
      }

      // Fallback if AI returned empty or unparseable JSON
      if (!Array.isArray(rawConcepts) || rawConcepts.length === 0) {
        console.warn(
          "[AI Planner] Received empty concept array. Applying multi-module fallback roadmap.",
        );
        rawConcepts = [
          {
            id: "c1",
            title: `${dto.title} Fundamentals & Core Setup`,
            description: `Core principles, environment setup, and basic concepts for ${dto.title}.`,
          },
          {
            id: "c2",
            title: `Core Data Structures & Implementation`,
            description: `Essential patterns, state management, and practical application logic.`,
          },
          {
            id: "c3",
            title: `Advanced Architecture & Patterns`,
            description: `Performance optimization, modular design, and edge-case handling.`,
          },
          {
            id: "c4",
            title: `Production Deployment & Testing`,
            description: `Best practices, automated testing, and deployment mechanics.`,
          },
        ];

        rawRelationships = [
          { source: "c1", target: "c2", type: RelationshipType.DEPENDS_ON },
          { source: "c2", target: "c3", type: RelationshipType.DEPENDS_ON },
          { source: "c3", target: "c4", type: RelationshipType.DEPENDS_ON },
        ];
      }

      // Map concept lookup keys to Database ObjectIds
      const conceptDocMap = new Map<string, Types.ObjectId>();

      const conceptDocsToInsert = rawConcepts.map((c: any, index: number) => {
        const _id = new Types.ObjectId();
        const conceptId = `concept_${generateUserId()}`;

        const keysToRegister = [
          c.id,
          c.conceptId,
          c.title ? c.title.toLowerCase() : null,
          `step_${index}`,
        ].filter(Boolean);

        keysToRegister.forEach((key) => conceptDocMap.set(key, _id));

        return {
          _id,
          conceptId,
          workspace: workspace._id,
          owner: ownerObjectId,
          title: c.title || `Module ${index + 1}`,
          description: c.description || "",
          order: index + 1,
        };
      });

      // Bulk insert concepts
      await Concept.insertMany(conceptDocsToInsert);
      console.log(
        `[AI Planner] Successfully inserted ${conceptDocsToInsert.length} concept nodes.`,
      );

      // Map relationships and bulk insert
      if (Array.isArray(rawRelationships) && rawRelationships.length > 0) {
        const relationshipDocsToInsert = rawRelationships
          .map((r: any) => {
            const sourceKey =
              r.sourceConceptId ||
              r.source ||
              (r.sourceTitle ? r.sourceTitle.toLowerCase() : "");
            const targetKey =
              r.targetConceptId ||
              r.target ||
              (r.targetTitle ? r.targetTitle.toLowerCase() : "");

            const sourceObjectId = conceptDocMap.get(sourceKey);
            const targetObjectId = conceptDocMap.get(targetKey);

            if (!sourceObjectId || !targetObjectId) return null;

            return {
              relationshipId: `rel_${generateUserId()}`,
              workspace: workspace._id,
              sourceConcept: sourceObjectId,
              targetConcept: targetObjectId,
              type: (r.type as RelationshipType) || RelationshipType.DEPENDS_ON,
            };
          })
          .filter(Boolean);

        if (relationshipDocsToInsert.length > 0) {
          await Relationship.insertMany(relationshipDocsToInsert);
          console.log(
            `[AI Planner] Successfully inserted ${relationshipDocsToInsert.length} relationship edges.`,
          );
        }
      }
    } catch (aiError) {
      console.error(
        "AI Planner blueprint generation failed during workspace creation:",
        aiError,
      );
      await this.createFallbackConceptRoadmap(
        workspace._id,
        ownerObjectId,
        dto.title,
      );
    }

    return workspace;
  }

  // Helper method to create a 4-module fallback roadmap if AI fails completely
  private async createFallbackConceptRoadmap(
    workspaceObjectId: Types.ObjectId,
    ownerObjectId: Types.ObjectId,
    title: string,
  ): Promise<void> {
    try {
      const fallbackModules = [
        {
          title: `${title} Fundamentals & Setup`,
          description: `Core principles, environment setup, and basic syntax for ${title}.`,
        },
        {
          title: `Data Structures & Implementation`,
          description: `Essential patterns, logic flow, and application handling.`,
        },
        {
          title: `Advanced Architecture & Systems`,
          description: `Optimization, modular design, and edge cases.`,
        },
        {
          title: `Production Deployment & Best Practices`,
          description: `Testing, deployment strategies, and industry standards.`,
        },
      ];

      const insertedDocs = [];
      for (let i = 0; i < fallbackModules.length; i++) {
        const doc = await Concept.create({
          conceptId: `concept_${generateUserId()}`,
          workspace: workspaceObjectId,
          owner: ownerObjectId,
          title: fallbackModules[i].title,
          description: fallbackModules[i].description,
          order: i + 1,
        });
        insertedDocs.push(doc);
      }

      // Connect sequential DEPENDS_ON relationships
      for (let i = 0; i < insertedDocs.length - 1; i++) {
        await Relationship.create({
          relationshipId: `rel_${generateUserId()}`,
          workspace: workspaceObjectId,
          sourceConcept: insertedDocs[i]._id,
          targetConcept: insertedDocs[i + 1]._id,
          type: RelationshipType.DEPENDS_ON,
        });
      }
    } catch (fallbackError) {
      console.error(
        "Failed to create fallback concept roadmap:",
        fallbackError,
      );
    }
  }

  async getUserWorkspaces(
    ownerObjectId: Types.ObjectId,
  ): Promise<IWorkspace[]> {
    return Workspace.find({ owner: ownerObjectId }).sort({ updatedAt: -1 });
  }

  async getWorkspaceById(
    workspaceId: string,
    userObjectId: Types.ObjectId,
  ): Promise<IWorkspace> {
    const workspace = await Workspace.findOne({ workspaceId });

    if (!workspace) {
      throw new NotFoundError("Workspace not found.");
    }

    const isOwner = workspace.owner.equals(userObjectId);
    if (!isOwner && workspace.visibility === WorkspaceVisibility.PRIVATE) {
      throw new ForbiddenError("Access denied to this private workspace.");
    }

    return workspace;
  }

  async updateWorkspace(
    workspaceId: string,
    userObjectId: Types.ObjectId,
    dto: UpdateWorkspaceDTO,
  ): Promise<IWorkspace> {
    const workspace = await Workspace.findOne({ workspaceId });

    if (!workspace) {
      throw new NotFoundError("Workspace not found.");
    }

    if (!workspace.owner.equals(userObjectId)) {
      throw new ForbiddenError("You are not allowed to perform this action.");
    }

    if (dto.title !== undefined) workspace.title = dto.title;
    if (dto.description !== undefined) workspace.description = dto.description;
    if (dto.visibility !== undefined) workspace.visibility = dto.visibility;

    await workspace.save();
    return workspace;
  }

  async deleteWorkspace(
    workspaceId: string,
    userObjectId: Types.ObjectId,
  ): Promise<void> {
    const workspace = await Workspace.findOne({ workspaceId });

    if (!workspace) {
      throw new NotFoundError("Workspace not found.");
    }

    if (!workspace.owner.equals(userObjectId)) {
      throw new ForbiddenError("You are not allowed to perform this action.");
    }

    await Workspace.deleteOne({ _id: workspace._id });
  }
}

export default new WorkspaceService();