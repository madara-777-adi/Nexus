import mongoose, { Types, ClientSession } from "mongoose";
import LearningProgressModel, {
  ILearningProgress,
  ConceptStatus,
} from "../models/learning-progress.model";
import LessonProgressModel, {
  ILessonProgress,
} from "../models/lesson-progress.model";
import ConceptModel from "../../concept/models/concept.model";
import RelationshipModel, {
  RelationshipType,
} from "../../relationship/models/relationship.model";
import Workspace from "../../workspace/models/workspace.model";
import generateUserId from "../../../shared/utils/generateUserId";
import { NotFoundError } from "../../../shared/errors/NotFoundError";
import { ForbiddenError } from "../../../shared/errors/ForbiddenError";

// Shape of a LessonProgress record after
// `.populate("concept", "conceptId")`: `concept` is the populated
// { _id, conceptId } object, not the raw Types.ObjectId that
// ILessonProgress (the Mongoose document interface) declares. Reuses
// ILessonProgress for every other field via Omit so this can never drift
// from the underlying schema.
export type IPopulatedLessonProgress = Omit<ILessonProgress, "concept"> & {
  concept: {
    _id: Types.ObjectId;
    conceptId: string;
  };
};

class LearningService {
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

  private async ensureFirstLessonProgressUnlocked(
    userObjectId: Types.ObjectId,
    concept: {
      workspace: Types.ObjectId;
      _id: Types.ObjectId;
      topics?: Array<{
        id: string;
        order: number;
        lessons?: Array<{ id: string; order: number }>;
      }>;
    },
    session: ClientSession | null,
  ): Promise<void> {
    const sortedChapters = [...(concept.topics ?? [])].sort(
      (a, b) => a.order - b.order,
    );
    const firstChapter = sortedChapters[0];
    if (!firstChapter) return;

    const firstLesson = [...(firstChapter.lessons ?? [])].sort(
      (a, b) => a.order - b.order,
    )[0];
    if (!firstLesson) return;

    let query = LessonProgressModel.findOne({
      user: userObjectId,
      workspace: concept.workspace,
      concept: concept._id,
      chapterId: firstChapter.id,
      lessonId: firstLesson.id,
    });
    if (session) query = query.session(session);

    const existing = await query;

    if (!existing) {
      const created = new LessonProgressModel({
        user: userObjectId,
        workspace: concept.workspace,
        concept: concept._id,
        chapterId: firstChapter.id,
        lessonId: firstLesson.id,
        status: ConceptStatus.UNLOCKED,
        masteryScore: 0,
        attemptsCount: 0,
      });
      if (session) await created.save({ session });
      else await created.save();
      return;
    }

    if (existing.status === ConceptStatus.LOCKED) {
      existing.status = ConceptStatus.UNLOCKED;
      if (session) await existing.save({ session });
      else await existing.save();
    }
  }

  /**
   * Entry point for callers outside LearningService (e.g. TeacherService,
   * once Tier-3 JIT generation commits the first chapter's lessons for a
   * concept) to trigger the same first-lesson unlock that
   * initializeWorkspaceProgress performs at bootstrap. Only acts if this
   * concept's LearningProgress is already UNLOCKED for this user — never
   * creates LessonProgress for a still-LOCKED Unit. Delegates entirely to
   * ensureFirstLessonProgressUnlocked, so the unlock rules (first chapter by
   * order, first lesson by order, no-op if that chapter has no lessons yet)
   * live in exactly one place.
   */
  async ensureFirstLessonUnlockedIfConceptUnlocked(
    userObjectId: Types.ObjectId,
    concept: {
      workspace: Types.ObjectId;
      _id: Types.ObjectId;
      topics?: Array<{
        id: string;
        order: number;
        lessons?: Array<{ id: string; order: number }>;
      }>;
    },
    session: ClientSession | null,
  ): Promise<void> {
    let progressQuery = LearningProgressModel.findOne({
      user: userObjectId,
      workspace: concept.workspace,
      concept: concept._id,
    });
    if (session) progressQuery = progressQuery.session(session);
    const progress = await progressQuery;

    if (progress && progress.status !== ConceptStatus.LOCKED) {
      await this.ensureFirstLessonProgressUnlocked(
        userObjectId,
        concept,
        session,
      );
    }
  }

  async initializeWorkspaceProgress(
    workspaceId: string,
    userObjectId: Types.ObjectId,
  ): Promise<ILearningProgress[]> {
    const workspace = await this.verifyWorkspaceOwnership(
      workspaceId,
      userObjectId,
    );
    const concepts = await ConceptModel.find({ workspace: workspace._id }).sort(
      { order: 1 },
    );
    const progressRecords: ILearningProgress[] = [];

    for (let i = 0; i < concepts.length; i++) {
      const concept = concepts[i];

      // V1 Bootstrap explicit patch: FIRST unit by order is UNLOCKED.
      // Everything else remains strictly LOCKED until progression tests are passed.
      const initialStatus =
        i === 0 ? ConceptStatus.UNLOCKED : ConceptStatus.LOCKED;

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

      if (progress.status === ConceptStatus.UNLOCKED) {
        await this.ensureFirstLessonProgressUnlocked(
          userObjectId,
          concept,
          null,
        );
      }

      progressRecords.push(progress);
    }

    return progressRecords;
  }

  async getWorkspaceProgress(
    workspaceId: string,
    userObjectId: Types.ObjectId,
  ): Promise<{
    concepts: ILearningProgress[];
    lessons: IPopulatedLessonProgress[];
  }> {
    const workspace = await this.verifyWorkspaceOwnership(
      workspaceId,
      userObjectId,
    );

    const [concepts, lessons] = await Promise.all([
      LearningProgressModel.find({
        user: userObjectId,
        workspace: workspace._id,
      }).populate("concept", "conceptId title level"),
      LessonProgressModel.find({
        user: userObjectId,
        workspace: workspace._id,
      }).populate<{ concept: { _id: Types.ObjectId; conceptId: string } }>(
        "concept",
        "conceptId",
      ),
    ]);

    return { concepts, lessons };
  }

  async recordEvaluationResult(
    conceptId: string,
    userObjectId: Types.ObjectId,
    masteryScore: number,
  ) {
    const concept = await ConceptModel.findOne({ conceptId });
    if (!concept) throw new NotFoundError("Target concept not found.");

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

  async recordLessonEvaluationResult(
    conceptId: string,
    chapterId: string,
    lessonId: string,
    userObjectId: Types.ObjectId,
    masteryScore: number,
  ) {
    const concept = await ConceptModel.findOne({ conceptId });
    if (!concept) throw new NotFoundError("Target concept not found.");

    const workspace = await Workspace.findById(concept.workspace);
    if (!workspace) throw new NotFoundError("Parent workspace not found.");
    if (!workspace.owner.equals(userObjectId)) {
      throw new ForbiddenError(
        "You do not have access to record evaluations in this workspace.",
      );
    }

    const chapter = concept.topics?.find((topic) => topic.id === chapterId);
    if (!chapter) {
      throw new NotFoundError("Target chapter not found in this concept.");
    }

    const lessons = chapter.lessons ?? [];
    const lessonIndex = lessons.findIndex((lesson) => lesson.id === lessonId);
    if (lessonIndex === -1) {
      throw new NotFoundError("Target lesson not found in this chapter.");
    }

    return await this.executeWithTransactionFallback(async (session) => {
      let progressQuery = LessonProgressModel.findOne({
        user: userObjectId,
        workspace: concept.workspace,
        concept: concept._id,
        chapterId,
        lessonId,
      });
      if (session) progressQuery = progressQuery.session(session);
      let progress = await progressQuery;

      if (!progress) {
        let conceptProgressQuery = LearningProgressModel.findOne({
          user: userObjectId,
          workspace: concept.workspace,
          concept: concept._id,
        });
        if (session)
          conceptProgressQuery = conceptProgressQuery.session(session);

        const conceptProgress = await conceptProgressQuery;

        const sortedChapters = [...(concept.topics ?? [])].sort(
          (a, b) => a.order - b.order,
        );
        const firstChapter = sortedChapters[0];
        const firstLesson = firstChapter
          ? [...(firstChapter.lessons ?? [])].sort(
              (a, b) => a.order - b.order,
            )[0]
          : undefined;

        const isInitialLesson =
          conceptProgress?.status === ConceptStatus.UNLOCKED &&
          firstChapter?.id === chapterId &&
          firstLesson?.id === lessonId;

        if (!isInitialLesson) {
          throw new ForbiddenError("This lesson has not been unlocked yet.");
        }

        progress = new LessonProgressModel({
          user: userObjectId,
          workspace: concept.workspace,
          concept: concept._id,
          chapterId,
          lessonId,
          status: ConceptStatus.UNLOCKED,
          masteryScore: 0,
          attemptsCount: 0,
        });
      } else if (progress.status === ConceptStatus.LOCKED) {
        throw new ForbiddenError("This lesson has not been unlocked yet.");
      }

      progress.masteryScore = masteryScore;
      progress.attemptsCount += 1;
      progress.lastEvaluatedAt = new Date();

      const PASSING_THRESHOLD = 80;
      if (masteryScore >= PASSING_THRESHOLD) {
        progress.status = ConceptStatus.MASTERED;
      } else if (progress.status !== ConceptStatus.MASTERED) {
        progress.status = ConceptStatus.IN_PROGRESS;
      }

      if (session) {
        await progress.save({ session });
      } else {
        await progress.save();
      }

      let unlockedDownstreamIds: string[] = [];
      let chapterMastered = false;

      if (progress.status === ConceptStatus.MASTERED) {
        const nextLesson = lessons[lessonIndex + 1];

        if (nextLesson) {
          await this.unlockLessonProgress(
            userObjectId,
            concept,
            chapterId,
            nextLesson.id,
            session,
          );
        } else {
          chapterMastered = await this.isChapterFullyMastered(
            userObjectId,
            concept,
            chapterId,
            lessons,
            session,
          );

          if (chapterMastered) {
            const sortedChapters = [...(concept.topics ?? [])].sort(
              (a, b) => a.order - b.order,
            );
            const chapterPos = sortedChapters.findIndex(
              (topic) => topic.id === chapterId,
            );
            const nextChapter = sortedChapters[chapterPos + 1];

            if (nextChapter) {
              const nextChapterLessons = [...(nextChapter.lessons ?? [])].sort(
                (a, b) => a.order - b.order,
              );
              const firstLesson = nextChapterLessons[0];

              if (firstLesson) {
                await this.unlockLessonProgress(
                  userObjectId,
                  concept,
                  nextChapter.id,
                  firstLesson.id,
                  session,
                );
              }
            } else {
              const conceptFullyMastered = await this.isConceptFullyMastered(
                userObjectId,
                concept,
                session,
              );

              if (conceptFullyMastered) {
                unlockedDownstreamIds =
                  await this.markConceptMasteredFromLessons(
                    concept,
                    userObjectId,
                    session,
                  );
              }
            }
          }
        }
      }

      return {
        progress,
        unlockedDownstreamIds,
        chapterMastered,
      };
    });
  }

  async assertLessonEvaluationAccess(
    conceptId: string,
    chapterId: string,
    lessonId: string,
    userObjectId: Types.ObjectId,
  ): Promise<void> {
    const concept = await ConceptModel.findOne({ conceptId });
    if (!concept) throw new NotFoundError("Target concept not found.");

    const workspace = await Workspace.findById(concept.workspace);
    if (!workspace) throw new NotFoundError("Parent workspace not found.");

    if (!workspace.owner.equals(userObjectId)) {
      throw new ForbiddenError(
        "You do not have access to record evaluations in this workspace.",
      );
    }

    const chapter = concept.topics?.find((topic) => topic.id === chapterId);
    if (!chapter) {
      throw new NotFoundError("Target chapter not found in this concept.");
    }

    const lessons = chapter.lessons ?? [];
    const lessonIndex = lessons.findIndex((lesson) => lesson.id === lessonId);
    if (lessonIndex === -1) {
      throw new NotFoundError("Target lesson not found in this chapter.");
    }
  }

  private async unlockLessonProgress(
    userObjectId: Types.ObjectId,
    concept: { workspace: Types.ObjectId; _id: Types.ObjectId },
    chapterId: string,
    lessonId: string,
    session: ClientSession | null,
  ): Promise<void> {
    let query = LessonProgressModel.findOne({
      user: userObjectId,
      workspace: concept.workspace,
      concept: concept._id,
      chapterId,
      lessonId,
    });
    if (session) query = query.session(session);
    const existing = await query;

    if (!existing) {
      const created = new LessonProgressModel({
        user: userObjectId,
        workspace: concept.workspace,
        concept: concept._id,
        chapterId,
        lessonId,
        status: ConceptStatus.UNLOCKED,
        masteryScore: 0,
        attemptsCount: 0,
      });
      if (session) await created.save({ session });
      else await created.save();
      return;
    }

    if (existing.status === ConceptStatus.LOCKED) {
      existing.status = ConceptStatus.UNLOCKED;
      if (session) await existing.save({ session });
      else await existing.save();
    }
  }

  private async isChapterFullyMastered(
    userObjectId: Types.ObjectId,
    concept: { workspace: Types.ObjectId; _id: Types.ObjectId },
    chapterId: string,
    lessons: Array<{ id: string }>,
    session: ClientSession | null,
  ): Promise<boolean> {
    if (lessons.length === 0) return false;

    let query = LessonProgressModel.find({
      user: userObjectId,
      workspace: concept.workspace,
      concept: concept._id,
      chapterId,
      status: ConceptStatus.MASTERED,
    });
    if (session) query = query.session(session);
    const masteredRecords = await query;
    const masteredIds = new Set(masteredRecords.map((r) => r.lessonId));

    return lessons.every((lesson) => masteredIds.has(lesson.id));
  }

  private async isConceptFullyMastered(
    userObjectId: Types.ObjectId,
    concept: {
      workspace: Types.ObjectId;
      _id: Types.ObjectId;
      topics?: Array<{ id: string; lessons?: Array<{ id: string }> }>;
    },
    session: ClientSession | null,
  ): Promise<boolean> {
    const allLessons: Array<{ chapterId: string; lessonId: string }> = [];
    for (const topic of concept.topics ?? []) {
      for (const lesson of topic.lessons ?? []) {
        allLessons.push({ chapterId: topic.id, lessonId: lesson.id });
      }
    }
    if (allLessons.length === 0) return false;

    let query = LessonProgressModel.find({
      user: userObjectId,
      workspace: concept.workspace,
      concept: concept._id,
      status: ConceptStatus.MASTERED,
    });
    if (session) query = query.session(session);
    const masteredRecords = await query;
    const masteredKeys = new Set(
      masteredRecords.map((r) => `${r.chapterId}::${r.lessonId}`),
    );

    return allLessons.every((l) =>
      masteredKeys.has(`${l.chapterId}::${l.lessonId}`),
    );
  }

  private async markConceptMasteredFromLessons(
    concept: { workspace: Types.ObjectId; _id: Types.ObjectId },
    userObjectId: Types.ObjectId,
    session: ClientSession | null,
  ): Promise<string[]> {
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
        masteryScore: 0,
      });
    }

    if (progress.status === ConceptStatus.MASTERED) {
      return [];
    }

    progress.status = ConceptStatus.MASTERED;
    progress.masteryScore = 100;
    progress.attemptsCount += 1;
    progress.lastEvaluatedAt = new Date();

    if (session) {
      await progress.save({ session });
    } else {
      await progress.save();
    }

    return this.evaluateAndUnlockDownstreamNodes(
      concept.workspace,
      concept._id,
      userObjectId,
      session,
    );
  }

  private async evaluateAndUnlockDownstreamNodes(
    workspaceObjectId: Types.ObjectId,
    sourceConceptObjectId: Types.ObjectId,
    userObjectId: Types.ObjectId,
    session: ClientSession | null,
  ): Promise<string[]> {
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
            await this.ensureFirstLessonProgressUnlocked(
              userObjectId,
              targetConcept,
              session,
            );
            newlyUnlockedConceptIds.push(targetConcept.conceptId);
          }
        }
      }
    }

    return newlyUnlockedConceptIds;
  }
}

export default new LearningService();
