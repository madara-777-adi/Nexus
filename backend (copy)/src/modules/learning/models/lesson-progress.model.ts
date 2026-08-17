import { Schema, model, Document, Types } from "mongoose";
import { ConceptStatus } from "./learning-progress.model";

export interface ILessonProgress extends Document {
  user: Types.ObjectId;
  workspace: Types.ObjectId;
  concept: Types.ObjectId;
  chapterId: string;
  lessonId: string;
  status: ConceptStatus;
  masteryScore: number;
  attemptsCount: number;
  lastEvaluatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const lessonProgressSchema = new Schema<ILessonProgress>(
  {
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
    chapterId: {
      type: String,
      required: true,
      index: true,
    },
    lessonId: {
      type: String,
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

lessonProgressSchema.index(
  { user: 1, workspace: 1, concept: 1, chapterId: 1, lessonId: 1 },
  { unique: true },
);

lessonProgressSchema.index({
  user: 1,
  workspace: 1,
  chapterId: 1,
  status: 1,
});

const LessonProgressModel = model<ILessonProgress>(
  "LessonProgress",
  lessonProgressSchema,
);

export default LessonProgressModel;