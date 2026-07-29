import { Types } from "mongoose";
import Workspace, {
  IWorkspace,
  WorkspaceVisibility,
} from "../models/workspace.model";
import Concept from "../../concept/models/concept.model";
import Relationship from "../../relationship/models/relationship.model";
import {
  CreateWorkspaceDTO,
  UpdateWorkspaceDTO,
} from "../validators/workspace.validator";
import generateUserId from "../../../shared/utils/generateUserId";
import { NotFoundError } from "../../../shared/errors/NotFoundError";
import { ForbiddenError } from "../../../shared/errors/ForbiddenError";
import { PlannerService } from "../../ai/planner/planner.service";

// Instantiate the AI Planner Service
const plannerService = new PlannerService();

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
      const planResult = await plannerService.generateBlueprint({
        title: dto.title,
        description: dto.description || "",
      });
      if (planResult && planResult.concepts && planResult.relationships) {
        // Map concept IDs to Database Documents
        const conceptDocMap = new Map<string, Types.ObjectId>();
        const conceptDocsToInsert = planResult.concepts.map((c: any) => {
          const _id = new Types.ObjectId();
          const conceptId = `concept_${generateUserId()}`;
          
          // Map by ID first, fallback to lowercase title for safety
          conceptDocMap.set(c.id || (c.title ? c.title.toLowerCase() : ""), _id);

          return {
            _id,
            conceptId,
            workspace: workspace._id,
            workspaceId: workspace.workspaceId,
            owner: ownerObjectId, // <-- FIX: Added missing owner field
            title: c.title,
            description: c.description || "",
          };
        });

        // Bulk insert concept documents
        if (conceptDocsToInsert.length > 0) {
          await Concept.insertMany(conceptDocsToInsert);
        }

        // Map relationships and bulk insert
        const relationshipDocsToInsert = planResult.relationships
          .map((r: any) => {
            // Safely look up IDs or normalized titles
            const sourceKey = r.sourceConceptId || r.source || (r.sourceTitle ? r.sourceTitle.toLowerCase() : "");
            const targetKey = r.targetConceptId || r.target || (r.targetTitle ? r.targetTitle.toLowerCase() : "");
            
            const sourceObjectId = conceptDocMap.get(sourceKey);
            const targetObjectId = conceptDocMap.get(targetKey);

            if (!sourceObjectId || !targetObjectId) return null;

            return {
              relationshipId: `rel_${generateUserId()}`,
              workspace: workspace._id,
              workspaceId: workspace.workspaceId,
              sourceConcept: sourceObjectId,
              targetConcept: targetObjectId,
              type: r.type || "DEPENDS_ON",
            };
          })
          .filter(Boolean);

        if (relationshipDocsToInsert.length > 0) {
          await Relationship.insertMany(relationshipDocsToInsert);
        }
      }
    } catch (aiError) {
      console.error(
        "AI Planner blueprint generation failed during workspace creation:",
        aiError,
      );
      // Fallback: The workspace is still created, but concepts can be added later manually
    }

    return workspace;
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