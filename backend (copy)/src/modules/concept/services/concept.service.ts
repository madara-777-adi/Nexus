import logger from "../../../shared/logger/logger";
import mongoose, { Types, ClientSession } from "mongoose";
import crypto from "crypto";
import ConceptModel, { IConcept, ITopic } from "../models/concept.model";
import Workspace from "../../workspace/models/workspace.model";
import RelationshipModel from "../../relationship/models/relationship.model";
import ResourceModel from "../../resource/models/resource.model";
import LearningProgressModel from "../../learning/models/learning-progress.model";
import LessonProgressModel from "../../learning/models/lesson-progress.model";
import LessonModel from "../models/lesson.model";
import FlashcardModel from "../../learning/models/flashcard.model";
import QuizModel from "../../learning/models/quiz.model";

import {
  CreateConceptDTO,
  UpdateConceptDTO,
} from "../validators/concept.validator";
import generateUserId from "../../../shared/utils/generateUserId";
import { NotFoundError } from "../../../shared/errors/NotFoundError";
import { ForbiddenError } from "../../../shared/errors/ForbiddenError";
import { RawTopicAIOutput } from "../../ai/teacher/teacher.service";
import { teacherService } from "../../ai/teacher/teacher.service";

class ConceptService {
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
      const isTransactionUnsupported =
        err?.code === 20 ||
        err?.codeName === "TransactionNumbersAreOnlyAllowedOnReplicaSet" ||
        (typeof err?.message === "string" &&
          err.message.includes("Transaction numbers are only allowed"));

      if (isTransactionUnsupported) {
        logger.warn(
          { service: "ConceptService" },
          "MongoDB transactions unsupported on standalone instance. Executing fallback without session.",
        );
        return await operation(null);
      }
      throw err;
    } finally {
      await session.endSession();
    }
  }

  private async verifyWorkspaceOwnership(
    workspaceId: string,
    userObjectId: Types.ObjectId,
  ) {
    const workspace = await Workspace.findOne({ workspaceId });
    if (!workspace) {
      throw new NotFoundError("Workspace not found.");
    }

    if (!workspace.owner.equals(userObjectId)) {
      throw new ForbiddenError("You do not have access to this workspace.");
    }

    return workspace;
  }

  public async generateTopicsForConcept(concept: IConcept): Promise<IConcept> {
    const workspace = await Workspace.findById(concept.workspace);

    // Placeholder: Concrete generation parameters (depth/granularity) will be passed here.
    const generatedTopics = await teacherService.generateTopics({
      conceptTitle: concept.title,
      conceptDescription: concept.description,
      workspaceContext: workspace
        ? {
            workspaceTitle: workspace.title,
          }
        : undefined,
    });

    const populatedTopics: ITopic[] = generatedTopics.topics.map(
      (topic: RawTopicAIOutput, index: number) => ({
        id: `tpc_${crypto.randomUUID()}`,
        title: topic.title,
        description: topic.description,
        order: index + 1,
        estimatedMinutes: topic.estimatedMinutes,
        generationStatus: "COMPLETED",
        unlockRequirements: {},
        lessons: [],
      }),
    );

    concept.topics = populatedTopics;
    await concept.save();

    return concept;
  }

  async createConcept(
    workspaceId: string,
    userObjectId: Types.ObjectId,
    dto: CreateConceptDTO,
  ): Promise<IConcept> {
    const workspace = await this.verifyWorkspaceOwnership(
      workspaceId,
      userObjectId,
    );

    let conceptId: string;
    do {
      conceptId = `cpt_${generateUserId()}`;
    } while (await ConceptModel.exists({ conceptId }));
    const conceptCount = await ConceptModel.countDocuments({
      workspace: workspace._id,
    });

    const nextOrder = conceptCount + 1;
    return ConceptModel.create({
      conceptId,
      workspace: workspace._id,
      owner: userObjectId,
      title: dto.title,
      description: dto.description || "",
      order: nextOrder,
      topics: [],
    });
  }

  async getConceptsByWorkspace(
    workspaceId: string,
    userObjectId: Types.ObjectId,
  ): Promise<IConcept[]> {
    const workspace = await this.verifyWorkspaceOwnership(
      workspaceId,
      userObjectId,
    );
    return ConceptModel.find({ workspace: workspace._id }).sort({
      order: 1,
    });
  }

  async getConceptById(
    conceptId: string,
    userObjectId: Types.ObjectId,
  ): Promise<IConcept> {
    const concept = await ConceptModel.findOne({ conceptId });
    if (!concept) {
      throw new NotFoundError("Concept not found.");
    }

    if (!concept.owner.equals(userObjectId)) {
      throw new ForbiddenError(
        "You do not have permission to view this concept.",
      );
    }

    return concept;
  }

  async updateConcept(
    conceptId: string,
    userObjectId: Types.ObjectId,
    dto: UpdateConceptDTO,
  ): Promise<IConcept> {
    const concept = await ConceptModel.findOne({ conceptId });
    if (!concept) {
      throw new NotFoundError("Concept not found.");
    }

    if (!concept.owner.equals(userObjectId)) {
      throw new ForbiddenError("You are not allowed to perform this action.");
    }

    if (dto.title !== undefined) concept.title = dto.title;
    if (dto.description !== undefined) concept.description = dto.description;

    await concept.save();
    return concept;
  }

  async deleteConcept(
    conceptId: string,
    userObjectId: Types.ObjectId,
  ): Promise<void> {
    const concept = await ConceptModel.findOne({ conceptId });
    if (!concept) {
      throw new NotFoundError("Concept not found.");
    }

    if (!concept.owner.equals(userObjectId)) {
      throw new ForbiddenError("You are not allowed to perform this action.");
    }

    await this.executeWithTransactionFallback(async (session) => {
      const options = session ? { session } : {};

      await Promise.all([
        RelationshipModel.deleteMany(
          {
            $or: [
              { sourceConcept: concept._id },
              { targetConcept: concept._id },
            ],
          },
          options,
        ),
        ResourceModel.deleteMany({ concept: concept._id }, options),
        LearningProgressModel.deleteMany({ concept: concept._id }, options),
        LessonProgressModel.deleteMany({ concept: concept._id }, options),
        LessonModel.deleteMany({ concept: concept._id }, options),
        FlashcardModel.deleteMany({ concept: concept._id }, options),
        QuizModel.deleteMany({ concept: concept._id }, options),
      ]);

      await ConceptModel.deleteOne({ _id: concept._id }, options);
    });
  }
}

export default new ConceptService();