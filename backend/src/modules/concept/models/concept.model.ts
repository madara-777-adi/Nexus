import { Schema, model, Document, Types } from "mongoose";

// Layer 2: Micro Curriculum Structure (2nd Pillars)
export interface ISubtopic {
  id: string; // Unique slug for routing and linking to Tier 3 records
  title: string;
  description?: string;
}

export interface IConcept extends Document {
  conceptId: string;
  workspace: Types.ObjectId;
  owner: Types.ObjectId;
  title: string;
  description?: string;
  
  // Progression & UI State
  order: number;
  isUnlocked: boolean;
  isMastered: boolean;
  
  // Layer 2 Storage
  topics?: ISubtopic[];
  
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
    // Layer 2 Storage
    topics: [
      {
        id: { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String, default: "" },
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Compound index for fast lookup within a workspace
conceptSchema.index({ workspace: 1, title: 1 });

const ConceptModel = model<IConcept>("Concept", conceptSchema);

export default ConceptModel;