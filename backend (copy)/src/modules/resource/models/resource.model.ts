import { Schema, model, Document, Types } from "mongoose";

export enum ResourceSource {
  AI_GENERATED = "AI_GENERATED",
  MANUAL = "MANUAL",
}

export interface IStructuredContent {
  definition?: string;
  whyItExists?: string;
  howItWorks?: string;
  example?: string;
  keyPoints?: string[];
  commonMisconceptions?: string;
  relatedConcepts?: string[]; // Suggestions only; never auto-created nodes
  summary?: string;
  rawText?: string; // Fallback for unstructured manual notes
}

export interface IResource extends Document {
  resourceId: string;
  workspace: Types.ObjectId;
  concept: Types.ObjectId;
  owner: Types.ObjectId;
  title: string;
  source: ResourceSource;
  content: IStructuredContent;
  createdAt: Date;
  updatedAt: Date;
}

const structuredContentSchema = new Schema<IStructuredContent>(
  {
    definition: { type: String, trim: true },
    whyItExists: { type: String, trim: true },
    howItWorks: { type: String, trim: true },
    example: { type: String, trim: true },
    keyPoints: [{ type: String, trim: true }],
    commonMisconceptions: { type: String, trim: true },
    relatedConcepts: [{ type: String, trim: true }],
    summary: { type: String, trim: true },
    rawText: { type: String, trim: true },
  },
  { _id: false },
);

const resourceSchema = new Schema<IResource>(
  {
    resourceId: {
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
    concept: {
      type: Schema.Types.ObjectId,
      ref: "Concept",
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
      required: [true, "Resource title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    source: {
      type: String,
      enum: Object.values(ResourceSource),
      default: ResourceSource.MANUAL,
    },
    content: {
      type: structuredContentSchema,
      required: true,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  },
);

// Compound index supporting filtering by concept and sorting by creation date
resourceSchema.index({ workspace: 1, concept: 1, createdAt: -1 });

const ResourceModel = model<IResource>("Resource", resourceSchema);

export default ResourceModel;