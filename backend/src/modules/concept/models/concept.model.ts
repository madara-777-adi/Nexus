import { Schema, model, Document, Types } from "mongoose";

export interface ISubtopic {
  title: string;
  description?: string;
  subtopics?: string[];
}

export interface IConcept extends Document {
  conceptId: string;
  workspace: Types.ObjectId;
  owner: Types.ObjectId;
  title: string;
  description?: string;
  // Layer 2: Micro Curriculum Structure
  topics?: ISubtopic[];
  // Layer 3: Cached AI Deep Dive & Pedagogy
  lessonPayload?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

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
    // Layer 2 Storage
    topics: [
      {
        title: { type: String, required: true },
        description: { type: String, default: "" },
        subtopics: [{ type: String }],
      },
    ],
    // Layer 3 Cache
    lessonPayload: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for fast lookup within a workspace
conceptSchema.index({ workspace: 1, title: 1 });

const ConceptModel = model<IConcept>("Concept", conceptSchema);

export default ConceptModel;
