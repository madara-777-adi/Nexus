import { Types } from "mongoose";
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
  private async verifyWorkspaceOwnership(
    workspaceId: string,
    userObjectId: Types.ObjectId,
  ) {
    const workspace = await Workspace.findOne({ workspaceId });
    if (!workspace) throw new NotFoundError("Workspace not found.");
    if (!workspace.owner.equals(userObjectId)) {
      throw new ForbiddenError("You do not have access to this workspace graph.");
    }
    return workspace;
  }

  // Bootstrap initial learning state when entering a workspace
  async initializeWorkspaceProgress(
    workspaceId: string,
    userObjectId: Types.ObjectId,
  ): Promise<ILearningProgress[]> {
    const workspace = await this.verifyWorkspaceOwnership(workspaceId, userObjectId);
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
    const workspace = await this.verifyWorkspaceOwnership(workspaceId, userObjectId);

    return LearningProgressModel.find({
      user: userObjectId,
      workspace: workspace._id,
    }).populate("concept", "conceptId title level");
  }

  // Deterministic Mastery Evaluation & Automatic Graph Unlock Cascade
  async recordEvaluationResult(
    conceptId: string,
    userObjectId: Types.ObjectId,
    masteryScore: number,
  ) {
    const concept = await ConceptModel.findOne({ conceptId });
    if (!concept) throw new NotFoundError("Target concept not found.");

    let progress = await LearningProgressModel.findOne({
      user: userObjectId,
      workspace: concept.workspace,
      concept: concept._id,
    });

    if (!progress) {
      let progressId: string;
      do {
        progressId = `prog_${generateUserId()}`;
      } while (await LearningProgressModel.exists({ progressId }));

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

    await progress.save();

    // Trigger graph cascade traversal if this node reached MASTERED
    let unlockedDownstreamIds: string[] = [];
    if (progress.status === ConceptStatus.MASTERED) {
      unlockedDownstreamIds = await this.evaluateAndUnlockDownstreamNodes(
        concept.workspace,
        concept._id,
        userObjectId,
      );
    }

    return {
      progress,
      unlockedDownstreamIds,
    };
  }

  // Graph Traversal: Unlocks downstream nodes ONLY when all required prerequisites are MASTERED
  private async evaluateAndUnlockDownstreamNodes(
    workspaceObjectId: Types.ObjectId,
    sourceConceptObjectId: Types.ObjectId,
    userObjectId: Types.ObjectId,
  ): Promise<string[]> {
    // 1. Find all relationships where the current concept is a DEPENDS_ON prerequisite
    const outgoingEdges = await RelationshipModel.find({
      workspace: workspaceObjectId,
      sourceConcept: sourceConceptObjectId,
      type: RelationshipType.DEPENDS_ON,
    });

    const newlyUnlockedConceptIds: string[] = [];

    for (const edge of outgoingEdges) {
      const targetConceptObjectId = edge.targetConcept;

      // 2. Find ALL prerequisite edges targeting this downstream node
      const prerequisiteEdges = await RelationshipModel.find({
        workspace: workspaceObjectId,
        targetConcept: targetConceptObjectId,
        type: RelationshipType.DEPENDS_ON,
      });

      const prereqConceptObjectIds = prerequisiteEdges.map((e) => e.sourceConcept);

      // 3. Check if the learner has MASTERED every single required prerequisite
      const masteredPrereqsCount = await LearningProgressModel.countDocuments({
        user: userObjectId,
        workspace: workspaceObjectId,
        concept: { $in: prereqConceptObjectIds },
        status: ConceptStatus.MASTERED,
      });

      if (masteredPrereqsCount === prereqConceptObjectIds.length) {
        const targetProgress = await LearningProgressModel.findOne({
          user: userObjectId,
          workspace: workspaceObjectId,
          concept: targetConceptObjectId,
        });

        if (targetProgress && targetProgress.status === ConceptStatus.LOCKED) {
          targetProgress.status = ConceptStatus.UNLOCKED;
          await targetProgress.save();

          const targetConcept = await ConceptModel.findById(targetConceptObjectId);
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