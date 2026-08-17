import { Schema, model, Document, Types } from "mongoose";

export enum ConceptStatus {
  LOCKED = "LOCKED",
  UNLOCKED = "UNLOCKED",
  IN_PROGRESS = "IN_PROGRESS",
  MASTERED = "MASTERED",
}

export interface ILearningProgress extends Document {
  progressId: string;
  user: Types.ObjectId;
  workspace: Types.ObjectId;
  concept: Types.ObjectId;
  status: ConceptStatus;
  masteryScore: number; // 0 to 100
  attemptsCount: number;
  lastEvaluatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const learningProgressSchema = new Schema<ILearningProgress>(
  {
    progressId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    concept: {
      type: Schema.Types.ObjectId,
      ref: "Concept",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(ConceptStatus),
      default: ConceptStatus.LOCKED,
    },
    masteryScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    attemptsCount: {
      type: Number,
      default: 0,
    },
    lastEvaluatedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

// Enforces one progress tracking record per user per concept within a workspace graph
learningProgressSchema.index(
  { user: 1, workspace: 1, concept: 1 },
  { unique: true },
);

// Fast aggregation index for querying user progress by status (e.g. fetching all MASTERED nodes)
learningProgressSchema.index({ user: 1, workspace: 1, status: 1 });

const LearningProgressModel = model<ILearningProgress>(
  "LearningProgress",
  learningProgressSchema,
);

export default LearningProgressModel;