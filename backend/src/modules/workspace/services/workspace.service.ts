import mongoose, { Types, ClientSession } from "mongoose";
import Workspace, {
  IWorkspace,
  WorkspaceVisibility,
} from "../models/workspace.model";
import Concept from "../../concept/models/concept.model";
import Relationship, {
  RelationshipType,
} from "../../relationship/models/relationship.model";
import ResourceModel from "../../resource/models/resource.model";
import LearningProgressModel from "../../learning/models/learning-progress.model";
import LessonModel from "../../concept/models/lesson.model";
import FlashcardModel from "../../learning/models/flashcard.model";
import QuizModel from "../../learning/models/quiz.model";

import {
  CreateWorkspaceDTO,
  UpdateWorkspaceDTO,
} from "../validators/workspace.validator";
import generateUserId from "../../../shared/utils/generateUserId";
import { NotFoundError } from "../../../shared/errors/NotFoundError";
import { ForbiddenError } from "../../../shared/errors/ForbiddenError";
import { plannerService } from "../../ai/planner/planner.service";

class WorkspaceService {
  /**
   * Helper to execute database operations inside a Mongo transaction when supported (Replica Sets / Atlas),
   * falling back cleanly to non-transactional execution for standalone MongoDB setups (local dev).
   */
  private async executeWithTransactionFallback<T>(
    operation: (session: ClientSession | null) => Promise<T>,
  ): Promise<T> {
    const session = await mongoose.startSession();
    try {
      let result: T | undefined;
      await session.withTransaction(async () => {
        result = await operation(session);
      });
      return result!;
    } catch (err: any) {
      // Check for error code 20 or transaction unsupported message (Standalone mongod)
      const isTransactionUnsupported =
        err?.code === 20 ||
        err?.codeName === "TransactionNumbersAreOnlyAllowedOnReplicaSet" ||
        (typeof err?.message === "string" &&
          err.message.includes("Transaction numbers are only allowed"));

      if (isTransactionUnsupported) {
        console.warn(
          "[WorkspaceService] MongoDB Transactions unsupported on standalone instance. Executing fallback without session.",
        );
        return await operation(null);
      }
      throw err;
    } finally {
      await session.endSession();
    }
  }

  /**
   * RC-005 Pure Helper: Normalizes AI raw blueprint output into concept/relationship arrays
   */
  private normalizeBlueprintPayload(planResult: any): {
    rawConcepts: any[];
    rawRelationships: any[];
  } {
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

    return { rawConcepts, rawRelationships };
  }

  /**
   * RC-005 Pure Helper: Builds fallback roadmap in-memory without database writes
   */
  private buildFallbackBlueprint(dtoTitle: string): {
    rawConcepts: any[];
    rawRelationships: any[];
  } {
    const rawConcepts = [
      {
        id: "c1",
        title: `${dtoTitle} Fundamentals & Core Setup`,
        description: `Core principles, environment setup, and basic concepts for ${dtoTitle}.`,
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

    const rawRelationships = [
      { source: "c1", target: "c2", type: RelationshipType.DEPENDS_ON },
      { source: "c2", target: "c3", type: RelationshipType.DEPENDS_ON },
      { source: "c3", target: "c4", type: RelationshipType.DEPENDS_ON },
    ];

    return { rawConcepts, rawRelationships };
  }

  async createWorkspace(
    ownerObjectId: Types.ObjectId,
    dto: CreateWorkspaceDTO,
  ): Promise<IWorkspace> {
    // 1. Generate unique custom ID
    let workspaceId: string;
    do {
      workspaceId = `ws_${generateUserId()}`;
    } while (await Workspace.exists({ workspaceId }));

    // 2. RC-005 Fix: AI Call MUST happen outside transaction boundaries
    let rawConcepts: any[] = [];
    let rawRelationships: any[] = [];

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

      const normalized = this.normalizeBlueprintPayload(planResult);
      rawConcepts = normalized.rawConcepts;
      rawRelationships = normalized.rawRelationships;
    } catch (aiError) {
      console.error(
        "AI Planner blueprint generation failed during workspace creation:",
        aiError,
      );
    }

    // Fallback if AI returned empty or unparseable payload
    if (!Array.isArray(rawConcepts) || rawConcepts.length === 0) {
      console.warn(
        "[AI Planner] Received empty concept array. Applying multi-module fallback roadmap.",
      );
      const fallback = this.buildFallbackBlueprint(dto.title);
      rawConcepts = fallback.rawConcepts;
      rawRelationships = fallback.rawRelationships;
    }

    // 3. RC-005 Fix: Atomic MongoDB Transaction for database writes with standalone fallback
    return await this.executeWithTransactionFallback(async (session) => {
      // A. Create Workspace shell inside session (or null session if fallback)
      const options = session ? { session } : {};
      const [workspaceDoc] = await Workspace.create(
        [
          {
            workspaceId,
            owner: ownerObjectId,
            title: dto.title,
            description: dto.description || "",
            visibility: dto.visibility || WorkspaceVisibility.PRIVATE,
          },
        ],
        options,
      );

      // B. Map concept lookup keys to Database ObjectIds
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
          workspace: workspaceDoc._id,
          owner: ownerObjectId,
          title: c.title || `Module ${index + 1}`,
          description: c.description || "",
          order: index + 1,
        };
      });

      // Bulk insert concepts
      await Concept.insertMany(conceptDocsToInsert, options);
      console.log(
        `[AI Planner] Successfully inserted ${conceptDocsToInsert.length} concept nodes.`,
      );

      // C. Map relationships and bulk insert
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
              workspace: workspaceDoc._id,
              sourceConcept: sourceObjectId,
              targetConcept: targetObjectId,
              type: (r.type as RelationshipType) || RelationshipType.DEPENDS_ON,
              owner: ownerObjectId,
            };
          })
          .filter(Boolean);

        if (relationshipDocsToInsert.length > 0) {
          await Relationship.insertMany(relationshipDocsToInsert, options);
          console.log(
            `[AI Planner] Successfully inserted ${relationshipDocsToInsert.length} relationship edges.`,
          );
        }
      }

      return workspaceDoc;
    });
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

  // RC-005 Patch 2: Delete Workspace Transaction with Standalone Fallback
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

    await this.executeWithTransactionFallback(async (session) => {
      const options = session ? { session } : {};
      await Concept.deleteMany({ workspace: workspace._id }, options);
      await Relationship.deleteMany({ workspace: workspace._id }, options);
      await ResourceModel.deleteMany({ workspace: workspace._id }, options);
      await LearningProgressModel.deleteMany(
        { workspace: workspace._id },
        options,
      );
      await LessonModel.deleteMany({ workspace: workspace._id }, options);
      await FlashcardModel.deleteMany({ workspace: workspace._id }, options);
      await QuizModel.deleteMany({ workspace: workspace._id }, options);
      await Workspace.deleteOne({ _id: workspace._id }, options);
    });
  }
}

export default new WorkspaceService();
