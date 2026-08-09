import { Schema, model, Document, Types } from "mongoose";

export interface ILessonNode {
  id: string;
  title: string;
  description?: string;
  order: number;
  estimatedMinutes: number;
  generationStatus: "PENDING" | "GENERATING" | "COMPLETED" | "FAILED";
}

export interface ITopic {
  id: string;
  title: string;
  description?: string;
  order: number;
  estimatedMinutes: number;
  generationStatus: "PENDING" | "GENERATING" | "COMPLETED" | "FAILED";
  unlockRequirements?: Record<string, unknown>;
  lessons?: ILessonNode[];
}

export interface IConcept extends Document {
  conceptId: string;
  workspace: Types.ObjectId;
  owner: Types.ObjectId;
  title: string;
  description?: string;
  order: number;
  isUnlocked: boolean;
  isMastered: boolean;
  topics: ITopic[];
  createdAt: Date;
  updatedAt: Date;
}

const lessonNodeSchema = new Schema<ILessonNode>(
  {
    id: {
      type: String,
      required: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    order: { type: Number, required: true, default: 1 },
    estimatedMinutes: { type: Number, default: 0 },
    generationStatus: {
      type: String,
      enum: ["PENDING", "GENERATING", "COMPLETED", "FAILED"],
      default: "PENDING",
    },
  },
  { _id: false },
);

const topicSchema = new Schema<ITopic>(
  {
    id: {
      type: String,
      required: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    order: { type: Number, required: true, default: 1 },
    estimatedMinutes: { type: Number, default: 0 },
    generationStatus: {
      type: String,
      enum: ["PENDING", "GENERATING", "COMPLETED", "FAILED"],
      default: "PENDING",
    },
    unlockRequirements: { type: Schema.Types.Mixed, default: {} },
    lessons: {
      type: [lessonNodeSchema],
      default: [],
    },
  },
  { _id: false },
);

const conceptSchema = new Schema<IConcept>(
  {
    conceptId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Concept title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
      default: "",
    },
    order: {
      type: Number,
      required: true,
      default: 1,
    },
    isUnlocked: {
      type: Boolean,
      default: false,
    },
    isMastered: {
      type: Boolean,
      default: false,
    },
    topics: {
      type: [topicSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

conceptSchema.index({ workspace: 1, title: 1 });

const ConceptModel = model<IConcept>("Concept", conceptSchema);

export default ConceptModel;