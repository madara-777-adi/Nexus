import mongoose, { Types, ClientSession } from "mongoose";
import LearningProgressModel, {
  ILearningProgress,
  ConceptStatus,
} from "../models/learning-progress.model";
import ConceptModel from "../../concept/models/concept.model";
import RelationshipModel, {
  RelationshipType,
} from "../../relationship/models/relationship.model";
import Workspace from "../../workspace/models/workspace.model";
import generateUserId from "../../../shared/utils/generateUserId";
import { NotFoundError } from "../../../shared/errors/NotFoundError";
import { ForbiddenError } from "../../../shared/errors/ForbiddenError";

class LearningService {
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
        console.warn(
          "[LearningService] MongoDB Transactions unsupported on standalone instance. Executing fallback without session.",
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
    if (!workspace) throw new NotFoundError("Workspace not found.");
    if (!workspace.owner.equals(userObjectId)) {
      throw new ForbiddenError(
        "You do not have access to this workspace graph.",
      );
    }
    return workspace;
  }

  // Bootstrap initial learning state when entering a workspace
  async initializeWorkspaceProgress(
    workspaceId: string,
    userObjectId: Types.ObjectId,
  ): Promise<ILearningProgress[]> {
    const workspace = await this.verifyWorkspaceOwnership(
      workspaceId,
      userObjectId,
    );
    const concepts = await ConceptModel.find({ workspace: workspace._id });
    const progressRecords: ILearningProgress[] = [];

    for (const concept of concepts) {
      // Check if node has incoming DEPENDS_ON prerequisites within this workspace
      const hasPrerequisites = await RelationshipModel.exists({
        workspace: workspace._id,
        targetConcept: concept._id,
        type: RelationshipType.DEPENDS_ON,
      });

      // Root concepts (zero prerequisites) default to UNLOCKED
      const initialStatus = hasPrerequisites
        ? ConceptStatus.LOCKED
        : ConceptStatus.UNLOCKED;

      let progress = await LearningProgressModel.findOne({
        user: userObjectId,
        workspace: workspace._id,
        concept: concept._id,
      });

      if (!progress) {
        let progressId: string;
        do {
          progressId = `prog_${generateUserId()}`;
        } while (await LearningProgressModel.exists({ progressId }));

        progress = await LearningProgressModel.create({
          progressId,
          user: userObjectId,
          workspace: workspace._id,
          concept: concept._id,
          status: initialStatus,
          masteryScore: 0,
        });
      }

      progressRecords.push(progress);
    }

    return progressRecords;
  }

  // Retrieve complete progression state for a workspace
  async getWorkspaceProgress(
    workspaceId: string,
    userObjectId: Types.ObjectId,
  ): Promise<ILearningProgress[]> {
    const workspace = await this.verifyWorkspaceOwnership(
      workspaceId,
      userObjectId,
    );

    return LearningProgressModel.find({
      user: userObjectId,
      workspace: workspace._id,
    }).populate("concept", "conceptId title level");
  }

  // RC-005 Patch 3: Atomic Evaluation & Unlock Cascade Transaction with Standalone Fallback
  async recordEvaluationResult(
    conceptId: string,
    userObjectId: Types.ObjectId,
    masteryScore: number,
  ) {
    const concept = await ConceptModel.findOne({ conceptId });
    if (!concept) throw new NotFoundError("Target concept not found.");

    // RC-004 / Audit Fix: Ensure user owns parent workspace using ObjectId
    const workspace = await Workspace.findById(concept.workspace);
    if (!workspace) throw new NotFoundError("Parent workspace not found.");
    if (!workspace.owner.equals(userObjectId)) {
      throw new ForbiddenError(
        "You do not have access to record evaluations in this workspace.",
      );
    }

    return await this.executeWithTransactionFallback(async (session) => {
      let progressQuery = LearningProgressModel.findOne({
        user: userObjectId,
        workspace: concept.workspace,
        concept: concept._id,
      });
      if (session) progressQuery = progressQuery.session(session);

      let progress = await progressQuery;

      if (!progress) {
        let progressId: string;
        do {
          progressId = `prog_${generateUserId()}`;
          let existsQuery = LearningProgressModel.exists({ progressId });
          if (session) existsQuery = existsQuery.session(session);

          var existsResult = await existsQuery;
        } while (existsResult);

        progress = new LearningProgressModel({
          progressId,
          user: userObjectId,
          workspace: concept.workspace,
          concept: concept._id,
          status: ConceptStatus.IN_PROGRESS,
        });
      }

      progress.masteryScore = masteryScore;
      progress.attemptsCount += 1;
      progress.lastEvaluatedAt = new Date();

      // Deterministic Progression Rule
      const PASSING_THRESHOLD = 80;
      if (masteryScore >= PASSING_THRESHOLD) {
        progress.status = ConceptStatus.MASTERED;
      } else if (
        progress.status === ConceptStatus.LOCKED ||
        progress.status === ConceptStatus.UNLOCKED
      ) {
        progress.status = ConceptStatus.IN_PROGRESS;
      }

      if (session) {
        await progress.save({ session });
      } else {
        await progress.save();
      }

      let unlockedDownstreamIds: string[] = [];

      // Trigger graph cascade traversal if this node reached MASTERED
      if (progress.status === ConceptStatus.MASTERED) {
        unlockedDownstreamIds = await this.evaluateAndUnlockDownstreamNodes(
          concept.workspace,
          concept._id,
          userObjectId,
          session,
        );
      }

      return {
        progress,
        unlockedDownstreamIds,
      };
    });
  }

  // Graph Traversal: Unlocks downstream nodes ONLY when all required prerequisites are MASTERED (Session-Aware)
  private async evaluateAndUnlockDownstreamNodes(
    workspaceObjectId: Types.ObjectId,
    sourceConceptObjectId: Types.ObjectId,
    userObjectId: Types.ObjectId,
    session: ClientSession | null,
  ): Promise<string[]> {
    // 1. Find all relationships where current concept is DEPENDS_ON prerequisite
    let outgoingQuery = RelationshipModel.find({
      workspace: workspaceObjectId,
      sourceConcept: sourceConceptObjectId,
      type: RelationshipType.DEPENDS_ON,
    });
    if (session) outgoingQuery = outgoingQuery.session(session);
    const outgoingEdges = await outgoingQuery;

    const newlyUnlockedConceptIds: string[] = [];

    for (const edge of outgoingEdges) {
      const targetConceptObjectId = edge.targetConcept;

      // 2. Find ALL prerequisite edges targeting downstream node
      let prereqQuery = RelationshipModel.find({
        workspace: workspaceObjectId,
        targetConcept: targetConceptObjectId,
        type: RelationshipType.DEPENDS_ON,
      });
      if (session) prereqQuery = prereqQuery.session(session);
      const prerequisiteEdges = await prereqQuery;

      const prereqConceptObjectIds = prerequisiteEdges.map(
        (e) => e.sourceConcept,
      );

      // 3. Check if learner has MASTERED every single required prerequisite
      let masteredCountQuery = LearningProgressModel.countDocuments({
        user: userObjectId,
        workspace: workspaceObjectId,
        concept: { $in: prereqConceptObjectIds },
        status: ConceptStatus.MASTERED,
      });
      if (session) masteredCountQuery = masteredCountQuery.session(session);
      const masteredPrereqsCount = await masteredCountQuery;

      if (masteredPrereqsCount === prereqConceptObjectIds.length) {
        let targetProgressQuery = LearningProgressModel.findOne({
          user: userObjectId,
          workspace: workspaceObjectId,
          concept: targetConceptObjectId,
        });
        if (session) targetProgressQuery = targetProgressQuery.session(session);
        const targetProgress = await targetProgressQuery;

        if (targetProgress && targetProgress.status === ConceptStatus.LOCKED) {
          targetProgress.status = ConceptStatus.UNLOCKED;
          if (session) {
            await targetProgress.save({ session });
          } else {
            await targetProgress.save();
          }

          let targetConceptQuery = ConceptModel.findById(targetConceptObjectId);
          if (session) targetConceptQuery = targetConceptQuery.session(session);
          const targetConcept = await targetConceptQuery;

          if (targetConcept) {
            newlyUnlockedConceptIds.push(targetConcept.conceptId);
          }
        }
      }
    }

    return newlyUnlockedConceptIds;
  }
}

export default new LearningService();
